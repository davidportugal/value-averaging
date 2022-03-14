import { useEffect, useState } from "react";
import { Row, Col } from "react-bootstrap";

const ResultsTable = ({ rows }) => {
  return (
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
        {rows.map((row, index) => {
          let action_volume_color =
            Math.sign(row.action_volume) <= 0 ? "green" : "#FF6961";
          let cash_flow_color =
            Math.sign(row.cash_flow) >= 0 ? "green" : "#FF6961";
          let cumulative_cash_flow_color =
            Math.sign(row.cumulative_cash_flow) >= 1 ? "green" : "#FF6961";
          return (
            <Row key={index} style={{ paddingTop: 3, paddingBottom: 3 }}>
              <Col>{row.date}</Col>
              <Col>{row.price}</Col>
              <Col>
                {row.current_volume === null ? "--" : row.current_volume}
              </Col>
              <Col>
                {row.current_volume_value === null
                  ? "--"
                  : row.current_volume_value}
              </Col>
              <Col style={{ backgroundColor: action_volume_color }}>
                {row.action_volume}
              </Col>
              <Col style={{ backgroundColor: cash_flow_color }}>
                {row.cash_flow}
              </Col>
              <Col style={{ backgroundColor: cumulative_cash_flow_color }}>
                {row.cumulative_cash_flow}
              </Col>
              <Col>{row.new_balance}</Col>
              <Col>{row.control}</Col>
              <Col>{row.ivv_price}</Col>
              <Col>{row.ivv}</Col>
            </Row>
          );
        })}
      </Col>
    </Row>
  );
};

export default ResultsTable;