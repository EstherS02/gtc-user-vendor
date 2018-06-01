$(function(){

    //get the line chart canvas
    var ctx = $("#line-chartcanvas");

    //line chart data
    var data = {
        labels: ["", "May 27", "May 28", "May 29", "May 30", "Jun 1"],
        backgroundColor: "lightgray",
        datasets: [
            {
                label: "Gray",
                data: [0.9, 0.2, 0.6, 0.9, 0.4, 0.5, 0.6],
                backgroundColor: "gray",
                borderColor: "lightgray",
                fill: false,
                lineTension: 0,
                radius: 5
            },
            {
                label: "Green",
                data: [0.0, 0.8, 0.2, 0.4, 1.1, 1.2, 0.5],
                backgroundColor: "green",
                borderColor: "lightgreen",
                fill: false,
                lineTension: 0,
                radius: 5
            }
        ]
    };

    //options
    var options = {
        responsive: true,
        title: {
            display: true,
            position: "top",
            text: "",
            fontSize: 18,
            fontColor: "#111"
        },
        legend: {
            display: true,
            position: "bottom",
            labels: {
                fontColor: "#333",
                fontSize: 16
            }
        }
    };

    //create Chart class object
    var chart = new Chart(ctx, {
        type: "line",
        data: data,
        options: options
    });
});