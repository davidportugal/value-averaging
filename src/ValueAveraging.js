import { useEffect, useState } from "react";
import { Row, Col, Container } from "react-bootstrap";
import "./App.css";
import papaparse from "papaparse";
import SPUUcsv from "./SPUU.csv";
import IVVcsv from "./IVV.csv";
import SPXLcsv from "./SPXL.csv";

/*
 * VALUE AVERAGING 2x and 3x LEVERAGED S&P 500 INDEX SPUU and SPXL
 *
 * Available Monthly data is from 6/2014 to 3/2022 (a little over 7.5 years)
 * Goal is to see if price volatility in leveraged ETFs return larger profits in a value averaging strategy
 * Run theoretical returns using varying windows of quarters, months, and even possibly days
 *
 */

const ValueAveraging = () => {
  // const [SPUU, setSPUU] = useState([]);
  // const [SPXL, setSPXL] = useState([]);
  // const [IVV, setIVV] = useState([]);
  const [rowsSPUU, setRowsSPUU] = useState([]);
  const[rowsSPXL, setRowsSPXL] = useState([]);
  const [isLoading, setIsLoading] = useState(false);

  const round = (value) => {
    return (Math.sign(value) * Math.round(Math.abs(value) * 10000)) / 10000;
  };

  useEffect(() => {
    setIsLoading(true);

    parseCSVFiles().then((results) => {
      // setSPUU(results[0]);
      // setSPXL(results[1]);
      // setIVV(results[2]);

      // monthly run
      getResults(results[0], results[2], "SPUU");
      getResults(results[1], results[2], "SPXL");

      console.log("finished running strategy");
      setIsLoading(false);
    });
  }, []);

  const parseCSVFiles = () => {
    return Promise.all([
      new Promise((resolve, reject) => {
        papaparse.parse(SPUUcsv, {
          download: true,
          complete: (results) => {
            results.data.shift();
            resolve(results);
          },
        });
      }),
      new Promise((resolve, reject) => {
        papaparse.parse(SPXLcsv, {
          download: true,
          complete: (results) => {
            results.data.shift();
            resolve(results);
          },
        });
      }),
      new Promise((resolve, reject) => {
        papaparse.parse(IVVcsv, {
          download: true,
          complete: (results) => {
            results.data.shift();
            resolve(results);
          },
        });
      }),
    ]);
  };

  const getResults = (results, ivv_results, etf) => {
    let initial_balance = 10000.0;
    let current_volume = null;
    let current_volume_value = null;
    let action_volume = 0.0;
    let cash_flow = 0.0;
    let cumulative_cash_flow = 0.0;
    let new_balance = 0.0;
    let control_volume = 0.0;
    let control = 0.0;
    let ivv_volume = 0.0;
    let ivv = 0.0;
    for (let i = 0; i < results.data.length; i++) {
      let date = results.data[i][0];
      let price = round(parseFloat(results.data[i][1]));
      let ivv_price = round(parseFloat(ivv_results.data[i][1]));
      if (i === 0) {
        action_volume = initial_balance / price;
        cash_flow = 0.0 - initial_balance;
        cumulative_cash_flow = cumulative_cash_flow + cash_flow;
        new_balance = initial_balance;
        control_volume = action_volume;
        control = initial_balance;
        ivv_volume = initial_balance / ivv_price;
        ivv = initial_balance;
      } else {
        new_balance = new_balance * 1.01; // 1% monthly gain
        control = control_volume * price;
        ivv = ivv_volume * ivv_price;
        if (current_volume === null) {
          current_volume = 0.0;
        }
        current_volume = current_volume + action_volume;
        current_volume_value = current_volume * price;
        cash_flow = current_volume_value - new_balance;
        cumulative_cash_flow = cumulative_cash_flow + cash_flow;
        action_volume = -cash_flow / price;
      }

      let row = {
        date: date,
        price: price,
        current_volume: current_volume === null ? current_volume : round(current_volume),
        current_volume_value: current_volume_value === null ? current_volume_value : round(current_volume_value),
        action_volume: round(action_volume),
        cash_flow: round(cash_flow),
        cumulative_cash_flow: round(cumulative_cash_flow),
        new_balance: round(new_balance),
        control: round(control),
        ivv_price: round(ivv_price),
        ivv: round(ivv)
      };
      
      let curr_rows = etf === "SPUU" ? rowsSPUU : rowsSPXL;
      curr_rows.push(row);
      etf === "SPUU" ? setRowsSPUU(curr_rows) : setRowsSPXL(curr_rows);
    }
  }

  return (
    <Container>
      <div style={{ paddingLeft: 20, paddingTop: 20 }}>
        <div style={{ fontWeight: "bold", fontSize: 20 }}>
          X% VALUE AVERAGING STRATEGY FOR 2x LEVERAGED INDEX (SPUU) AND 3x LEVERAGED INDEX (SPXL) ON THE S&P500 (IVV)
        </div>
        <div style={{ paddingTop: 15 }}>
          This project is meant to compare the performance of said strategy over
          multiple periods of time to the performance of SPUU and IVV over the
          same periods of time.
        </div>
      </div>
      {(isLoading && <div>LOADING DATA</div>) || (
        <div>
          <div style={{ paddingTop: 30, fontSize: 24, fontWeight: "bold" }}>
            MONTHLY RESULTS - 1% GROWTH
          </div>
          <div style={{ paddingTop: 20, fontSize: 18, fontWeight: "bold" }}>
            DIREXION DAILY S&P 500 BULL 2x (SPUU)
          </div>
          <Row>
            <Col
              style={{
                marginTop: 20,
                paddingTop: 10,
                borderStyle: "solid",
                borderColor: "black",
                fontSize: 13,
              }}
            >
              <Row style={{ fontSize: 14, fontWeight: "bold", paddingBottom: 5 }}>
                <Col>DATE</Col>
                <Col>OPEN PRICE</Col>
                <Col>CURRENT VOLUME</Col>
                <Col>CURRENT VOLUME VALUE</Col>
                <Col>ACTION VOLUME</Col>
                <Col>CASH FLOW</Col>
                <Col>CUMULATIVE CASH FLOW</Col>
                <Col>NEW BALANCE</Col>
                <Col>CONTROL (SPUU)</Col>
                <Col>S&P 500 (IVV) OPEN PRICE</Col>
                <Col>S&P 500 (IVV)</Col>
              </Row>
              {rowsSPUU.map((row, index) => {
                let action_volume_color = Math.sign(row.action_volume) <= 0 ? "green" : "#FF6961"
                let cash_flow_color = Math.sign(row.cash_flow) >= 0 ? "green" : "#FF6961";
                let cumulative_cash_flow_color = Math.sign(row.cumulative_cash_flow) >= 1 ? "green" : "#FF6961";
                return (
                  <Row style={{ paddingTop: 3, paddingBottom: 3 }}>
                    <Col>{row.date}</Col>
                    <Col>{row.price}</Col>
                    <Col>{row.current_volume === null ? "--" : row.current_volume}</Col>
                    <Col>{row.current_volume_value === null ? "--" : row.current_volume_value}</Col>
                    <Col style={{ backgroundColor: action_volume_color }}>{row.action_volume}</Col>
                    <Col style={{ backgroundColor: cash_flow_color }}>{row.cash_flow}</Col>
                    <Col style={{ backgroundColor: cumulative_cash_flow_color }}>{row.cumulative_cash_flow}</Col>
                    <Col>{row.new_balance}</Col>
                    <Col>{row.control}</Col>
                    <Col>{row.ivv_price}</Col>
                    <Col>{row.ivv}</Col>
                  </Row>
                );
              })}
            </Col>
          </Row>

          <div style={{ paddingTop: 40, fontSize: 18, fontWeight: "bold" }}>
            DIREXION DAILY S&P 500 BULL 3x (SPXL)
          </div>
          <Row>
            <Col
              style={{
                marginTop: 20,
                paddingTop: 10,
                borderStyle: "solid",
                borderColor: "black",
                fontSize: 13,
              }}
            >
              <Row style={{ fontSize: 14, fontWeight: "bold", paddingBottom: 5 }}>
                <Col>DATE</Col>
                <Col>OPEN PRICE</Col>
                <Col>CURRENT VOLUME</Col>
                <Col>CURRENT VOLUME VALUE</Col>
                <Col>ACTION VOLUME</Col>
                <Col>CASH FLOW</Col>
                <Col>CUMULATIVE CASH FLOW</Col>
                <Col>NEW BALANCE</Col>
                <Col>CONTROL (SPXL)</Col>
                <Col>S&P 500 (IVV) OPEN PRICE</Col>
                <Col>S&P 500 (IVV)</Col>
              </Row>
              {rowsSPXL.map((row, index) => {
                let action_volume_color = Math.sign(row.action_volume) <= 0 ? "green" : "#FF6961"
                let cash_flow_color = Math.sign(row.cash_flow) >= 0 ? "green" : "#FF6961";
                let cumulative_cash_flow_color = Math.sign(row.cumulative_cash_flow) >= 1 ? "green" : "#FF6961";
                return (
                  <Row style={{ paddingTop: 3, paddingBottom: 3 }}>
                    <Col>{row.date}</Col>
                    <Col>{row.price}</Col>
                    <Col>{row.current_volume === null ? "--" : row.current_volume}</Col>
                    <Col>{row.current_volume_value === null ? "--" : row.current_volume_value}</Col>
                    <Col style={{ backgroundColor: action_volume_color }}>{row.action_volume}</Col>
                    <Col style={{ backgroundColor: cash_flow_color }}>{row.cash_flow}</Col>
                    <Col style={{ backgroundColor: cumulative_cash_flow_color }}>{row.cumulative_cash_flow}</Col>
                    <Col>{row.new_balance}</Col>
                    <Col>{row.control}</Col>
                    <Col>{row.ivv_price}</Col>
                    <Col>{row.ivv}</Col>
                  </Row>
                );
              })}
            </Col>
          </Row>
        </div>
      )}
    </Container>
  );
};

export default ValueAveraging;
