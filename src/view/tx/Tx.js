import React, { Component } from "react";
import { connect } from "react-redux";
import * as authActions from "../../actions/auth.actions";


class Tx extends Component {

  render() {
    return (
      <div className="App">
        <table>
          <tr>
            <td>
              <div style={{ height: '100px', width: 250, 'background-color': 'grey' }}></div>
            </td>
            <td>
              <div style={{ height: '100px', width: 250, 'background-color': 'grey', 'margin-left': 40 }}></div>
            </td>
          </tr>
        </table>

        <button onClick={() => this.props.login(() => { })}>Submit</button>
      </div>
    );
  }

}


export default connect(
  null,
  authActions
)(Tx); 