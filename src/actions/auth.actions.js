import axios from "axios";


export const login = (callback) => async dispatch => {
    try {
        debugger;
        var result = await axios.get("/FrontTerminal/webTerminal/auth/login");

        result = result && result.data; 

        dispatch({ type: "LOGIN", data: result });

        callback && callback(result);
    } catch (err) {
        callback && callback(null, err);
    }
};