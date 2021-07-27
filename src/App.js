import React, { Component } from "react";
import { connect } from "react-redux";
import logo from './vc-logo.jpg';
import './App.css';
import * as authActions from "./actions/auth.actions";
import { Login, Tx } from './view'

class App extends Component {

  render() {
    return (
      <div className="min-h-screen">
        <div class="flex justify-between p-6 bg-green-50 shadow-md">

          <div className="text-4xl font-semibold"><span className="text-black font-bold">Volt</span><span className="text-voltcash italic">Cash</span></div>
          <button onClick={this.props.logOut}
            className="ml-8 whitespace-nowrap inline-flex items-center justify-center px-4 py-2 border border-transparent rounded-md shadow-sm text-base font-medium text-white bg-voltcash hover:bg-green-700"
          >
            Log Out
                </button>
        </div>


        {this.getPage()}


      </div>
    );
  }
 

  getPage = () => {
    switch (this.props.route) {
      case 'Login': return <Login />
      case 'Tx': return <Tx />
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