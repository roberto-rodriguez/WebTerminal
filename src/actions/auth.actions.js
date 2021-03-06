import axios from "axios";


export const login = (errorCallback) => async dispatch => {
    try {
        debugger;
        var result = await axios.get("/FrontTerminal/webTerminal/auth/login");

        result = result && result.data;

        dispatch({ type: "LOGIN", data: result });

    } catch (err) {
        errorCallback && errorCallback(null, err);
    }
};

export const logOut = (errorCallback) => async dispatch => {
    try {
        dispatch({ type: "LOGOUT" });

    } catch (err) {
        errorCallback && errorCallback(null, err);
    }
};