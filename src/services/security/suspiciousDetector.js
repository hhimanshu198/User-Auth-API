const detectSuspiciousLogin = ({
    currentLogin,
    previousLogins
}) => {

    let isNewDevice = true;
    let isNewCountry = true;

    for (const login of previousLogins) {

        if (
            login.browser === currentLogin.browser &&
            login.os === currentLogin.os &&
            login.device === currentLogin.device
        ) {
            isNewDevice = false;
        }

        if (login.country === currentLogin.country) {
            isNewCountry = false;
        }
    }

    const currentHour = new Date().getHours();

    const unusualLoginTime =
        currentHour >= 1 && currentHour <= 5;

    return {
        isNewDevice,
        isNewCountry,
        unusualLoginTime
    };
};

module.exports = {
    detectSuspiciousLogin
};