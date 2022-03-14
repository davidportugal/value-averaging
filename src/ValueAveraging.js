import { useEffect, useState } from "react";
import { Row, Col, Container } from "react-bootstrap";
import "./App.css";
import ResultsTable from "./ResultsTable";
import LineChart from "./LineChart.js"
import papaparse from "papaparse";
import SPUUcsv from "./SPUU.csv";
import IVVSPUUcsv from "./IVVSPUU.csv";
import IVVSPXLcsv from "./IVVSPXL.csv";
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

  const [resultsChartDataSPUU, setResultsChartDataSPUU] = useState([]);
  const [resultsChartDataSPXL, setResultsChartDataSPXL] = useState([]);
  const [datesSPUU, setDatesSPUU] = useState([]);
  const [datesSPXL, setDatesSPXL] = useState([]);
  const [rowsSPUU, setRowsSPUU] = useState([]);
  const [rowsSPXL, setRowsSPXL] = useState([]);
  const [isLoading, setIsLoading] = useState(false);

  const round = (value) => {
    return (Math.sign(value) * Math.round(Math.abs(value) * 10000)) / 10000;
  };

  useEffect(() => {
    setIsLoading(true);

    parseCSVFiles().then((results) => {
    //   setResultsChartDataArrayIVV(results[2]);

      // monthly run
      let rowsSPUULocal = getResults(results[0], results[2], "SPUU");
      let rowsSPXLLocal = getResults(results[1], results[3], "SPXL");

      setResultsChartDataArray(rowsSPUULocal, "SPUU");
      setDatesArray(rowsSPUULocal, "SPUU");
      setResultsChartDataArray(rowsSPXLLocal, "SPXL");
      setDatesArray(rowsSPXLLocal, "SPXL");

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
          }
        });
      }),
      new Promise((resolve, reject) => {
        papaparse.parse(SPXLcsv, {
          download: true,
          complete: (results) => {
            results.data.shift();
            resolve(results);
          }
        });
      }),
      new Promise((resolve, reject) => {
        papaparse.parse(IVVSPUUcsv, {
          download: true,
          complete: (results) => {
            results.data.shift();
            resolve(results);
          }
        });
      }),
      new Promise((resolve, reject) => {
        papaparse.parse(IVVSPXLcsv, {
          download: true,
          complete: (results) => {
            results.data.shift();
            resolve(results);
          }
        });
      }),
    ]);
  };

  const setResultsChartDataArray = (results, label) => {
      
    //   // PRICE
    //   let priceChartData = {}
    //   let prices = results.reduce((prices, row, index) => {
    //     if (prices.length === 0) {
    //         prices = []
    //     }
    //     prices.push(row['price']);
    //     return prices;
    //   }, []);

    //   priceChartData['data'] = prices;
    //   priceChartData['dataLabel'] = 'Price';


      // TOTAL BALANCE: CUMULATIVE CASH FLOW + NEW BALANCE
      let totBalChartData = {}
      let totBals = results.reduce((totBals, row, index) => {
        if (totBals.length === 0) {
            totBals = []
        }
        totBals.push(round(row['cumulative_cash_flow'] + row['new_balance']));
        return totBals;
      }, []);

      totBalChartData['data'] = totBals;
      totBalChartData['dataLabel'] = "Total Balance at 1% Growth"


      // CONTROL
      let controlChartData = {}
      let controls = results.reduce((controls, row, index) => {
          if (controls.length === 0) {
              controls = []
          }
          controls.push(row['control']);
          return controls;
      }, []);


      controlChartData['data'] = controls;
      controlChartData['dataLabel'] = "Control";


      let currChartData = label === "SPUU" ? resultsChartDataSPUU : resultsChartDataSPXL;
      currChartData.push(totBalChartData, controlChartData);
      if (label === "SPUU") {
        setResultsChartDataSPUU(currChartData);
      } else {
        setResultsChartDataSPXL(currChartData);
      }
  }

  const setResultsChartDataArrayIVV = (ivv) => {
      // PRICE

      // TOTAL BALANCE
  }


  const setDatesArray = (results, label) => {
      let dates = results.reduce((dates, row, index) => {
        if (dates.length === 0) {
            dates = []
        }
        dates.push(row['date']);
        return dates;
      }, []);

      if (label === "SPUU") {
        setDatesSPUU(dates);
      } else {
        setDatesSPXL(dates);
      }
  }

  const getResults = (results, ivv_results, etf) => {
    let curr_rows = [];

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
      
      curr_rows = etf === "SPUU" ? rowsSPUU : rowsSPXL;
      curr_rows.push(row);
      etf === "SPUU" ? setRowsSPUU(curr_rows) : setRowsSPXL(curr_rows);
    }

    return curr_rows;
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

          {/* SPUU */}
          <div style={{ paddingTop: 20, fontSize: 18, fontWeight: "bold" }}>
            DIREXION DAILY S&P 500 BULL 2x (SPUU)
          </div>
          <ResultsTable
            rows={rowsSPUU}
          />
          {resultsChartDataSPUU.length > 0 &&
            <LineChart
                labels={datesSPUU}
                results={resultsChartDataSPUU}
            />
          }
          
          {/* SPXL */}  
          <div style={{ paddingTop: 40, fontSize: 18, fontWeight: "bold" }}>
            DIREXION DAILY S&P 500 BULL 3x (SPXL)
          </div>
          <ResultsTable
            rows={rowsSPXL}
          />
          {resultsChartDataSPXL.length > 0 &&
            <LineChart
              labels={datesSPXL}
              results={resultsChartDataSPXL}
            />
          }
        </div>
      )}
    </Container>
  );
};

export default ValueAveraging;
