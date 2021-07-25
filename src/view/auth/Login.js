import React, { Component } from "react";
import { connect } from "react-redux"; 
import * as authActions from "../../actions/auth.actions";
 

class Login extends Component {

  render() {
    return (
      <div className="App">
          <p>Username</p>
        <input type="text"/>
          <p>Password</p>
        <input type="password"/>

        <button onClick={() => this.props.login(() => { })}>Login</button>
      </div>
    );
  }

}
 

export default connect(
  null,
  authActions
)(Login); 