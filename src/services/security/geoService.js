const geoip = require("geoip-lite");

const getLocationFromIP = (ip) => {
    const geo = geoip.lookup(ip);

    if (!geo) {
        return {
            country: "Unknown",
            city: "Unknown"
        };
    }

    return {
        country: geo.country || "Unknown",
        city: geo.city || "Unknown"
    };
};

module.exports = {
    getLocationFromIP
};