import React, { Component } from "react";
import { connect } from "react-redux";
import logo from './logo.svg';
import './App.css';
import * as authActions from "./actions/auth.actions";
 

class App extends Component {

  render() {
    return (
      <div className="App">
        <header className="App-header">
          <img src={logo} className="App-logo" alt="logo" />
          <p>
            New Terminal
        </p>


          {this.props.id ? 
            (
              <a
                className="App-link"
                href="https://reactjs.org"
                target="_blank"
                rel="noopener noreferrer"
              >
                {`Bienvenida ${this.props.name} !!!`}
              </a>
            ):
            (<button onClick={() => this.props.login(() => { })}>Login</button>)
            }

        </header>
      </div>
    );
  }

}

const mapStateToProps = ({ auth }) => ({
  id: auth.id,
  name: auth.name
});

export default connect(
  mapStateToProps,
  authActions
)(App); 