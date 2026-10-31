const { getActivePlanOrFallback } = require("./planService");

/* ===============================
   NATURAL LANGUAGE ACCESS CONTROL
================================ */

const ROLE = {
  ADMIN: 1,
  USER: 2
};

/* ===============================
   VOCABULARY ENGINE
================================ */

const VOCABULARY = {
  actions: {
    read: [
      "view",
      "see",
      "read",
      "show",
      "list",
      "get",
      "check",
      "fetch",
      "display"
    ],

    delete: [
      "delete",
      "remove",
      "erase",
      "destroy",
      "drop"
    ],

    update: [
      "update",
      "edit",
      "change",
      "modify",
      "alter"
    ],

    access: [
      "access",
      "use",
      "open",
      "enter",
      "unlock"
    ]
  },

  resources: {
    profile: [
      "profile",
      "profiles",
      "account",
      "accounts",
      "personal details",
      "user info"
    ],

    users: [
      "user",
      "users",
      "member",
      "members",
      "customer",
      "customers"
    ],

    basic_feature: [
      "basic",
      "basic feature",
      "starter feature"
    ],

    pro_feature: [
      "pro",
      "premium",
      "pro feature",
      "advanced feature"
    ]
  },

  scopes: {
    own: [
      "my",
      "mine",
      "own",
      "myself",
      "me",
      "self"
    ],

    others: [
      "other",
      "others",
      "another",
      "someone else",
      "different user",
      "other user",
      "other users",
      "other profiles",
      "others profiles"
    ],

    all: [
      "all",
      "everyone",
      "every user",
      "entire list",
      "all users"
    ]
  }
};

/* ===============================
   HELPERS
================================ */

const normalizeText = (text = "") => {
  return text
    .toLowerCase()
    .replace(/[?.,']/g, "")
    .replace(/\s+/g, " ")
    .trim();
};

const detectFromVocabulary = (text, category) => {
  for (const [key, words] of Object.entries(category)) {
    if (words.some((word) => text.includes(word))) {
      return key;
    }
  }

  return "unknown";
};

/* ===============================
   DETECTORS
================================ */

const detectAction = (text) => {
  return detectFromVocabulary(text, VOCABULARY.actions);
};

const detectResource = (text) => {
  return detectFromVocabulary(text, VOCABULARY.resources);
};

const detectScope = (text) => {
  const scope = detectFromVocabulary(text, VOCABULARY.scopes);

  return scope === "unknown" ? "any" : scope;
};

const detectSubject = (text) => {
  if (
    text.includes("non admin") ||
    text.includes("non admins") ||
    text.includes("non-admin") ||
    text.includes("non-admins") ||
    text.includes("not admin") ||
    text.includes("not admins") ||
    text.includes("normal user") ||
    text.includes("normal users") ||
    text.includes("regular user") ||
    text.includes("regular users") ||
    text.includes("basic user") ||
    text.includes("basic users")
  ) {
    return "non_admin";
  }

  if (
    text.includes("admin") ||
    text.includes("admins") ||
    text.includes("administrator") ||
    text.includes("administrators")
  ) {
    return "admin";
  }

  return "current_user";
};

/* ===============================
   SUBJECT ROLE RESOLUTION
================================ */

const getEffectiveRoleId = ({ subject, loggedInRoleId }) => {
  if (subject === "admin") {
    return ROLE.ADMIN;
  }

  if (subject === "non_admin") {
    return ROLE.USER;
  }

  return loggedInRoleId;
};

/* ===============================
   RISK ENGINE
================================ */

const calculateRisk = ({ action, resource, scope }) => {
  if (action === "delete" && resource === "users") {
    return "critical";
  }

  if (scope === "all" || scope === "others") {
    return "high";
  }

  if (action === "update") {
    return "medium";
  }

  return "low";
};

/* ===============================
   ENDPOINT MAPPING
================================ */

const getMatchedEndpoint = ({ action, resource, scope }) => {
  if (
    action === "read" &&
    resource === "profile" &&
    scope === "own"
  ) {
    return "GET /users/me";
  }

  if (
    action === "read" &&
    resource === "profile" &&
    scope === "others"
  ) {
    return "GET /users/:id";
  }

  if (
    action === "read" &&
    resource === "users"
  ) {
    return "GET /users";
  }

  if (
    action === "delete" &&
    resource === "users"
  ) {
    return "DELETE /users/:id";
  }

  if (
    action === "access" &&
    resource === "basic_feature"
  ) {
    return "GET /users/basic";
  }

  if (
    action === "access" &&
    resource === "pro_feature"
  ) {
    return "GET /users/pro";
  }

  return null;
};

/* ===============================
   POLICIES
================================ */

const policies = [
  {
    id: "PROFILE_READ_OWN",
    action: "read",
    resource: "profile",
    scope: "own",
    allowedRoles: [ROLE.ADMIN, ROLE.USER],
    reason: "Authenticated users can view their own profile",
    suggestion: "Use your own profile endpoint instead."
  },

  {
    id: "PROFILE_READ_OTHERS",
    action: "read",
    resource: "profile",
    scope: "others",
    allowedRoles: [ROLE.ADMIN],
    reason: "Only admins can view other users' profiles",
    suggestion: "Ask an admin to perform this action."
  },

  {
    id: "USERS_READ_ALL",
    action: "read",
    resource: "users",
    scope: "all",
    allowedRoles: [ROLE.ADMIN],
    reason: "Only admins can view the full user list",
    suggestion: "Normal users can only view their own profile."
  },

  {
    id: "USERS_DELETE_ANY",
    action: "delete",
    resource: "users",
    scope: "any",
    allowedRoles: [ROLE.ADMIN],
    reason: "Only admins can delete users",
    suggestion: "Ask an admin to delete the user."
  },

  {
    id: "BASIC_FEATURE_ACCESS",
    action: "access",
    resource: "basic_feature",
    scope: "any",
    allowedPlans: [2, 3],
    reason: "Basic and Pro subscribers can access this feature",
    suggestion: "Upgrade to Basic or Pro plan."
  },

  {
    id: "PRO_FEATURE_ACCESS",
    action: "access",
    resource: "pro_feature",
    scope: "any",
    allowedPlans: [3],
    reason: "Only Pro subscribers can access this feature",
    suggestion: "Upgrade to Pro plan."
  }
];

/* ===============================
   POLICY MATCHER
================================ */

const findPolicy = ({ action, resource, scope }) => {
  return (
    policies.find(
      (policy) =>
        policy.action === action &&
        policy.resource === resource &&
        policy.scope === scope
    ) ||
    policies.find(
      (policy) =>
        policy.action === action &&
        policy.resource === resource &&
        policy.scope === "any"
    )
  );
};

/* ===============================
   MAIN ENGINE
================================ */

const evaluateAccess = async ({ userId, roleId, request }) => {
  const text = normalizeText(request);

  const action = detectAction(text);
  const resource = detectResource(text);
  const scope = detectScope(text);
  const subject = detectSubject(text);

  const effectiveRoleId = getEffectiveRoleId({
    subject,
    loggedInRoleId: roleId
  });

  const risk = calculateRisk({
    action,
    resource,
    scope
  });

  const matchedEndpoint = getMatchedEndpoint({
    action,
    resource,
    scope
  });

  const matchedPolicy = findPolicy({
    action,
    resource,
    scope
  });

  if (!matchedPolicy) {
    return {
      allowed: false,
      decision: "DENY",
      subject,
      action,
      resource,
      scope,
      risk,
      matchedEndpoint,
      matchedPolicy: null,
      checks: null,
      confidence: "low",
      explanation: "The engine could not safely map this request to a known policy.",
      suggestion: "Try asking with a clearer action and resource.",
      timestamp: new Date().toISOString()
    };
  }

  let allowed = false;
  let currentPlan = null;

  if (matchedPolicy.allowedRoles) {
    allowed = matchedPolicy.allowedRoles.includes(effectiveRoleId);
  }

  if (matchedPolicy.allowedPlans) {
    const plan = await getActivePlanOrFallback(userId);

    currentPlan = {
      id: plan.id,
      name: plan.name,
      fallbackApplied: plan.isFallback
    };

    allowed = matchedPolicy.allowedPlans.includes(plan.id);
  }

  return {
    allowed,
    decision: allowed ? "ALLOW" : "DENY",
    subject,
    action,
    resource,
    scope,
    risk,
    matchedEndpoint,

    matchedPolicy: {
      id: matchedPolicy.id,
      reason: matchedPolicy.reason
    },

    checks: {
      roleCheck: matchedPolicy.allowedRoles
        ? {
            requiredRoles: matchedPolicy.allowedRoles,
            actualLoggedInRole: roleId,
            evaluatedRole: effectiveRoleId,
            passed: matchedPolicy.allowedRoles.includes(effectiveRoleId)
          }
        : null,

      planCheck: matchedPolicy.allowedPlans
        ? {
            requiredPlans: matchedPolicy.allowedPlans,
            userPlan: currentPlan,
            passed: currentPlan
              ? matchedPolicy.allowedPlans.includes(currentPlan.id)
              : false
          }
        : null
    },

    confidence: "high",

    explanation: allowed
      ? `Access allowed because policy ${matchedPolicy.id} matched and all required checks passed.`
      : `Access denied because policy ${matchedPolicy.id} matched but required checks failed.`,

    suggestion: allowed ? null : matchedPolicy.suggestion,

    timestamp: new Date().toISOString()
  };y
};

module.exports = {
  evaluateAccess
};