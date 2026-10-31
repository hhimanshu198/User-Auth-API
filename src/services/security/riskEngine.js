const calculateRiskScore = ({
    isNewDevice,
    isNewCountry,
    failedAttempts,
    unusualLoginTime
}) => {

    let riskScore = 0;

    if (isNewDevice) {
        riskScore += 30;
    }

    if (isNewCountry) {
        riskScore += 40;
    }

    if (failedAttempts >= 5) {
        riskScore += 25;
    }

    if (unusualLoginTime) {
        riskScore += 10;
    }

    let riskLevel = "SAFE";

    if (riskScore >= 60) {
        riskLevel = "HIGH";
    } else if (riskScore >= 30) {
        riskLevel = "MEDIUM";
    }

    return {
        riskScore,
        riskLevel,
        isSuspicious: riskScore >= 30
    };
};

module.exports = {
    calculateRiskScore
};