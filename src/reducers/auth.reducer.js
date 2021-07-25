const initialState = {
  id: null,
  name: null,
  route: 'Login' // Login, Tx 
};

export default function authReducer(state = initialState, action) {
  var { type, data } = action;

  switch (type) { 
    case "LOGIN":
      return {
        ...state,
        ...data,
        route: 'Tx'
      };
 
    default:
      return state;
  }
}
