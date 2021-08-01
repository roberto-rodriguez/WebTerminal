import React, { Component } from "react";
import { connect } from "react-redux";  
import parse from 'xml-parser';
import './App.css';
import * as authActions from "./actions/auth.actions";
import { Login, Tx } from './view'

class App extends Component {

  componentDidMount() {
    var scannerType = 0;
    var scannerAddress = 'https://rdm-usb-ns';

    var _this = this;

    var RESP_TYPE = { NA: 0, STATE: 1, OPERATION: 2, RESPXML: 3, XML: 4 }

    this.connectToDevice(scannerAddress, function (xUrl) {
      // alert('xUrl = ' + xUrl);

      var postSciRequest = _this.SciAsync(xUrl);

      postSciRequest(RESP_TYPE.OPERATION, "ClaimScanner", null, null, (a, b, c) => {
        //ClaimScanner - onSuccess 
        var x = a;
        var y = b;
        var z = c;

        postSciRequest(RESP_TYPE.XML, "GetScannerXml", null, null, (xml, e, f) => {
          //GetScannerXml - onSuccess
          var terminalInfo = _this.parseScannerXML(xml);

          postSciRequest(RESP_TYPE.STATE, "GetState", null, null, (conn, state, f) => {

            if (state) {
              //resetScannerIfError
              if (state.toUpperCase() === 'ERROR') {
                alert('Scanner is in [' + state + '] state. Click OK to continue the operation');
                postSciRequest(RESP_TYPE.OPERATION, "CompleteOperation", 5);
                return;
              } else if (state.toUpperCase() === 'BUSY') {
                alert('Scanner is in [' + state + '] state. Click OK to continue the operation');

                postSciRequest(RESP_TYPE.OPERATION, "CompleteOperation", 4);
              } else {
                alert("GetState return unknown state: " + state + " plesae call customer service");
              }
            } else {

              var sciRetryCount = 0;

              var onDrainResponseComplete = (sciConn, resp) => {


                if (resp && resp.length > 0) { //If there are responses to drain
                  if (++sciRetryCount > 500) {
                    alert("Failed draining SCI responses. (Too many responses in the queue)");
                    return;
                  }

                  postSciRequest(RESP_TYPE.RESPXML, "GetResponseXml", null, null, onDrainResponseComplete, onDrainResponsesError);
                }
 
                //start operation  
                postSciRequest(RESP_TYPE.OPERATION, "StartOperation", "1" /*startType = ScanSingleItem*/, _this.startOperationXml,
                  (result) => { 

                    //GetResponseXml
                    postSciRequest(RESP_TYPE.RESPXML, "GetResponseXml", 1, null,
                      (xml, b, c) => {
                        //Process response:
                        var parsedXML = parse(xml);

                        var result = {};

                        _this.xml2Obj(parsedXML.root, result);

                        result = result.ResponseData;

                        if (result.Exception) {
                          var ExceptionData = result.Exception.ExceptionData;

                          if (ExceptionData && ExceptionData.Description) {
                            alert(ExceptionData.Description + '. ' + ExceptionData.Action);
                          } else {
                            alert('Could not scan check. Please try again');
                          }
                        } else {
                          var ImageFront = result.ImageFront;
                          var ImageBack = result.ImageBack;
                          debugger;
                          alert('success');
                        }

                      }, (x, y, z) => { debugger });

                  }, (x, y, z) => { debugger });
              }

              var onDrainResponsesError = (sciConn, msg) => {
                var sciRetryCount = 0;
                alert('Error draining response: ' + msg);
              }

              //drainSciResponses
              postSciRequest(RESP_TYPE.RESPXML, "GetResponseXml", null, null, onDrainResponseComplete, onDrainResponsesError);


            }




          }, (a, b, c) => {// onError
            debugger;
            var x = a;
            var y = b;
            var z = c;
          });
        }, (a, b, c) => {//GetScannerXml - onError
          debugger;
          var x = a;
          var y = b;
          var z = c;
        });
      }, (a, b, c) => {//ClaimScanner - onError
        debugger;
        var x = a;
        var y = b;
        var z = c;
      });
    });
  }

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

  xml2Obj = (xml, obj) => {
    var _this = this;
    var value = xml.content;
 
    if (!value && xml.children) {
      value = {};

      xml.children.forEach((child) => {
        _this.xml2Obj(child, value);
      });
    }

    if (xml.name && value) {
      obj[xml.name] = value;
    }
  }

  parseScannerXML = (xml) => {
    var parsedXML = parse(xml);

    var terminalInfo = {
      caps: {},
      licenses: this.parseScannerXMLLicenses(),
      meta: {}
    };

    var params = {
      'CapFeeder': 'feeder',
      'CapIdCardImaging': 'idCardImaging',
      'CapMsr': 'msr',
      'CapPrinter': 'printer',
      'CapSignalButton': 'signalButton',
      'CapEndorser': 'endorser',
      'CapFranker': 'frank'
    };

    var paramNames = Object.keys(params);

    parsedXML.root.children.forEach(cap => {
      if (paramNames.indexOf(cap.name) >= 0) {

        var capParams = {};

        cap.children.forEach(function (attr) {
          capParams[attr.name] = attr.content;
        });

        if (capParams["Available"] == "true") {
          terminalInfo.caps[params[cap.name]] = capParams["Detail"];
        }
      }
    });


    terminalInfo.meta.scannerType = this.getXmlElemValue(parsedXML, 'MetaScannerType', '');
    terminalInfo.meta.serialNumber = this.getXmlElemValue(parsedXML, 'MetaSerialNumber', 'N/A');

    return terminalInfo;
  }

  getXmlElemValue(xmlObj, tag, defaultValue) {
    var value = null;
    xmlObj.root.children.forEach(cap => {
      if (cap.name == tag) {
        value = cap.content;
        return;
      }
    });

    return value || defaultValue;
  }

  parseScannerXMLLicenses($deviceXML) {
    var lic = { OcrANumeric: false, OcrAAlphanumeric: false, OcrBAlphaNumberic: false, BatchFeedRate: null };
    //Dont apply here because this terminal return this tag empty <MetaLicenses/>
    //     var $elemCap = $deviceXML.find('MetaLicenses');
    //     lic.text = '';
    //     if( $elemCap.length > 0 ) {
    //         lic.rawText = $elemCap.text();

    //         if( lic.rawText.indexOf('OcrANumeric') ) {
    //             lic.OcrANumeric = true;
    //         }
    //         if( lic.rawText.indexOf('OcrAAlphaNumeric') ) {
    //             lic.OcrAAlphaNumeric = true;
    //         }
    //         if( lic.rawText.indexOf('OcrBAlphaNumeric') ) {
    //             lic.OcrBAlphaNumberic = true;
    //         }
    //         if( lic.rawText.indexOf('BatchFeedRate30') ) {
    //             lic.BatchFeedRate = 30;
    //         }
    //         if( lic.rawText.indexOf('BatchFeedRate60') ) {
    //             lic.BatchFeedRate = 60;
    //         }
    //         if( lic.rawText.indexOf('BatchFeedRate90') ) {
    //             lic.BatchFeedRate = 60;
    //         }
    //     }
    return lic;
  }


  connectToDevice = function (deviceTarget, onSuccess) {
    var USER_ID = 'SCI.SAMPLE';


    var candidateHosts = ["https://rdm-usb-ns", "https://rdm-usb-ns.local", "https://usb.rdmscanners.net"]
      , testPath = "/SCI/7.0/sci.esp"
      , allDoneFlags = [];

    function doTestConnection(xhost, xtestPath, xonTestPassed, xonTestFailed) {
      var sciXHR = new XMLHttpRequest();

      sciXHR.onerror = function () {
        if (typeof xonTestFailed === 'function')
          xonTestFailed.call(null);
      };

      sciXHR.onreadystatechange = function () {
        if (this.readyState === 4) {
          if (this.status === 200) {
            if (typeof xonTestPassed === 'function') {
              xonTestPassed.call(null, xhost + xtestPath);
            }
          } else {
            if (typeof xonTestFailed === 'function') {
              xonTestFailed.call(null);
            }
          }
        }
      };

      try {
        sciXHR.open("POST", xhost + xtestPath, true);
        sciXHR.setRequestHeader("Content-type", "application/x-www-form-urlencoded");
        sciXHR.send("Function=GetSciVersion&UserId=Any&Parameter=&Data=");
      } catch (err) {
        if (typeof xonTestFailed === 'function') {
          xonTestFailed.call(null, err);
        }
      }
    }

    if (typeof deviceTarget !== 'string') {
      if (deviceTarget !== undefined && deviceTarget !== null) {
        throw new TypeError('connectToDevice() requires a string parameter ');
      }
    }


    allDoneFlags = new Array(candidateHosts.length);
    allDoneFlags.forEach(function (_, xi) {
      this[xi] = false;
    });

    candidateHosts.forEach(function (xhost, xi) {

      doTestConnection(
        xhost,
        testPath,
        onSuccess,
        // function (xUrl) {
        //   var a = xUrl;
        //   debugger;
        //  // deferred.resolve(new SciAsync(xUrl));
        // },
        function () {
          var xj;
          allDoneFlags[xi] = true;
          for (xj = 0; xj < allDoneFlags.length; ++xj) {
            if (!allDoneFlags[xj]) {
              return;
            }
          }
          alert("Unable to connect to the device!");
          // deferred.reject("Unable to connect to the device!");
        });
    });

    // return deferred;
    return null;
  }

  SciAsync = (xSciUrl) => {
    var mUserId = 'SCI.SAMPLE';

    if (typeof this !== 'object')
      throw new TypeError('SciCore must be constructed via new');
    //'use strict';



    var mSciUrl = xSciUrl, _self = this, RESP_TYPE = { NA: 0, STATE: 1, OPERATION: 2, RESPXML: 3, XML: 4 };

    function trimString(x) {
      return x.replace(/^\s+|\s+$/gm, '');
    }

    function getISODateString() {
      function pad(num) {
        var norm = Math.floor(Math.abs(num));
        return (norm < 10 ? '0' : '') + norm;
      }

      var now = new Date();
      var tzo = -(now.getTimezoneOffset());
      var dif = tzo >= 0 ? '+' : '-';

      return now.getFullYear() +
        '-' + pad(now.getMonth() + 1) +
        '-' + pad(now.getDate()) +
        'T' + pad(now.getHours()) +
        ':' + pad(now.getMinutes()) +
        ':' + pad(now.getSeconds()) +
        dif + pad(tzo / 60) +
        ':' + pad(tzo % 60);
    }

    // function postSciRequest(respType, func, param, xml, resolve, reject) {
    return (respType, func, param, xml, resolve, reject) => {
      var request, sciXHR, xml2, rtn;

      if (!mSciUrl) {
        throw new Error('No Scanner is connected, please call testConnection() first!');
      } else if (undefined === mUserId || mUserId === null) {
        throw new Error('claimScanner has to be invoked first!');
      }

      request = "Function=" + func + "&UserId=" + encodeURIComponent(mUserId);

      if (param) {
        request = request + "&Parameter=" + param;
      }
      if (xml) {
        xml2 = xml.replace(/[\n\r]+/g, '');
        request = request + "&Data=" + encodeURIComponent(xml2);
      }
      if (func === 'ClaimScanner') {
        request = request + "&SessionTime=" + getISODateString();
      }

      rtn = _self;

      //  rtn = new RDMSciV1.deferred(_self);

      sciXHR = new XMLHttpRequest();
      sciXHR.open("POST", mSciUrl, true);
      sciXHR.setRequestHeader("Content-type",
        "application/x-www-form-urlencoded");

      sciXHR.onerror = function () {
        // rtn.reject("Function '" + func + "' failed. (XMLHttpRequest error)");
        reject("Function '" + func + "' failed. (XMLHttpRequest error)");
      };

      sciXHR.onreadystatechange = function () {
        var resp;
        if (sciXHR.readyState == 4) {
          // rtn.onAbort = null;
          if (rtn.timer) {
            clearTimeout(rtn.timer);
            rtn.timer = null;
          }
          if (sciXHR.status === 200) {
            resp = trimString(sciXHR.responseText);
            if (respType === RESP_TYPE.STATE) {
              if (resp.toUpperCase() === "IDLE" || resp.toUpperCase() === "BUSY" || resp.toUpperCase() === "ERROR") {
                // rtn.resolve(resp);
                resolve(resp);
              } else {
                // rtn.reject("Function 'GetState' failed. (SCI error: Unknown SCI state '" + resp + "')");
                reject("Function 'GetState' failed. (SCI error: Unknown SCI state '" + resp + "')");
              }
            } else if (respType === RESP_TYPE.RESPXML) {
              if (resp.substr(0, 5) === "<?xml") {
                // rtn.resolve(resp);
                resolve(resp);
              } else if (resp.length == 0 || resp.toUpperCase() === "NO DATA") {
                // rtn.resolve("");
                resolve("");
              } else {
                // rtn.reject("Function '" + func + "' failed.(SCI error: " + resp + ")");
                reject("Function '" + func + "' failed.(SCI error: " + resp + ")");
              }
            } else if (respType === RESP_TYPE.XML) {
              if (resp.substr(0, 5) === "<?xml") {
                // rtn.resolve(resp);
                resolve(resp);
              } else {
                // rtn.reject("Function '" + func + "' failed.(SCI error: " + resp + ")");
                reject("Function '" + func + "' failed.(SCI error: " + resp + ")");
              }
            } else if (respType === RESP_TYPE.OPERATION) {
              if (resp !== "Success") {
                // rtn.reject("Function '" + func + "' failed.(SCI error: " + resp + ")");
                reject("Function '" + func + "' failed.(SCI error: " + resp + ")");
              } else {
                // rtn.resolve(resp);
                resolve(resp);
              }
            } else {
              // rtn.resolve(resp);
              resolve(resp);
            }
          } else {
            // rtn.reject("Function '" + func + "' failed. (HTTP: " + sciXHR.status + ")");
            reject("Function '" + func + "' failed. (HTTP: " + sciXHR.status + ")");
          }
        }
      };

      rtn.onAbort = function () {
        sciXHR.abort();
        // rtn.reject("Function '" + func + "' timed out.");
        reject("Function '" + func + "' timed out.");
      };

      sciXHR.send(request);
      rtn.timer = setTimeout(function () {
        sciXHR.abort();
      }, 15000);


      return rtn;
    }
  }

  startOperationXml = `<StartOperationDetail xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xmlns:xsd="http://www.w3.org/2001/XMLSchema">
  <Micr>
      <Enabled>true</Enabled>
      <BeepOnError>false</BeepOnError>
      <StopOnError>true</StopOnError>
      <Parse>false</Parse>
      <Font>E13b</Font>
  </Micr>
  <Frank>
      <Enabled>false</Enabled>
      <Update>false</Update>
      <RegionOffset>10</RegionOffset>
      <RegionLength>30</RegionLength>
  </Frank>
  <PhysicalEndorsement>
      <Enabled>false</Enabled>
      <ReferenceEdge>Lead</ReferenceEdge>
      <XOffset>1000</XOffset>
      <Type>Bold</Type>
      <Data>Sequence:[SEQUENCE]</Data>
  </PhysicalEndorsement>
  <Image>
      <Enabled>true</Enabled>
      <Format>Tiff</Format>
      <Endian>Little</Endian>
      <Surfaces>Both</Surfaces>
      <Color>Bilevel</Color>
      <Compressed>true</Compressed>
      <Resolution>200</Resolution>
      <IqaEnabled>false</IqaEnabled>
      <BeepOnError>false</BeepOnError>
      <StopOnError>true</StopOnError>
  </Image>
</StartOperationDetail>`;

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