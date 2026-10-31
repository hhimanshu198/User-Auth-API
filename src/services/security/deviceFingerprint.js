const crypto = require("crypto");

const generateDeviceFingerprint = ({
    browser,
    os,
    device,
    ip
}) => {

    const rawFingerprint = `${browser}-${os}-${device}-${ip}`;

    return crypto
        .createHash("sha256")
        .update(rawFingerprint)
        .digest("hex");
};

module.exports = {
    generateDeviceFingerprint
};