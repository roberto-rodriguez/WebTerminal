const initialState = {
  id: null,
  name: null,
  appStarted: false 
};

export default function authReducer(state = initialState, action) {
  var { type, data } = action;

  switch (type) { 
    case "LOGIN":
      return {
        ...state,
        ...data,
        appStarted: true
      };
 
    default:
      return state;
  }
}
