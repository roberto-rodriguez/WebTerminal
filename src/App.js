import React, { Component } from "react";
import { connect } from "react-redux";
import logo from './logo.svg';
import './App.css';
import * as authActions from "./actions/auth.actions";
import { Login, Tx } from './view'

class App extends Component {

  render() {
    return (
      <div className="App">
        <header className="App-header">
          <img src={logo} className="App-logo" alt="logo" />
          <p>
            New Terminal
        </p>


          {this.getPage()}

        </header>
      </div>
    );
  }

  getPage = () => {
    switch(this.props.route){
      case 'Login': return <Login/>
      case 'Tx': return <Tx/>
    }
  }

}

const mapStateToProps = ({ auth }) => ({ 
  route: auth.route
});

export default connect(
  mapStateToProps,
  authActions
)(App); 