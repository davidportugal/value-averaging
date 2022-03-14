import React, { useState, useEffect } from 'react';
import { Line } from 'react-chartjs-2';
import { CDBContainer } from 'cdbreact';
import { randomColor } from 'randomcolor';
import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    Title,
    Tooltip,
    Legend,
  } from 'chart.js';
  
  ChartJS.register(
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    Title,
    Tooltip,
    Legend
  );

const LineChart = ({ labels, results }) => {
    const [data, setData] = useState({});
    const [priceData, setPriceData] = useState({});
    const [options, setOptions] = useState({});

    useEffect(() => {
        if (results !== null && results.length > 0) {
            let datasets = results.map((result) => {
                let dataset = {}
                dataset['label'] = result.dataLabel;
                dataset['data'] = result.data;
                dataset['borderColor'] = randomColor();
                dataset['borderDash'] = result.dataLabel === 'Price' ? [5,5] : [0,0];
                dataset['yAxisID'] = result.dataLabel === 'Price' ? 'priceData' : 'data';

                return dataset;
            });

            setData({
                labels: labels,
                datasets:  datasets
            });

            setOptions({
                responsive: true,
                scales: {
                    data: {
                            id: "data",
                            position: "left",
                            type: "linear"
                        },
                    priceData: {
                            id: "priceData",
                            position: "right",
                            ticks: {
                                stepSize: 11,
                            },
                            type: "linear"
                        }
                }
            })
        }


    }, []);

    return (
            JSON.stringify(data) !== '{}' &&
            <CDBContainer style={{ backgroundColor: "grey", marginTop: 20 }}>
                {/* <h3 className="mt-5" style={{ paddingTop: 20, paddingLeft: 20}}>
                    Line chart
                    </h3> */}
                <Line data={data} options={options}/>
            </CDBContainer>
    )
}

export default LineChart;