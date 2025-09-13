let labels, absolute_savings;

const script = document.querySelector('#savings + div > script');
if (script) {
  const code = script.textContent;

  const match = code.match(/data:\s*({[\s\S]*?})\s*,\s*options:/);
  if (match) {
    let dataStr = match[1];

    // ensure property names are quoted
    dataStr = dataStr.replace(/(\w+):/g, '"$1":');
    // replace single quotes with double quotes (if any)
    dataStr = dataStr.replace(/'/g, '"');

    try {
      const dataObj = JSON.parse(dataStr);

      labels = dataObj.labels;
      absolute_savings = dataObj.datasets[0].data;
    } catch (e) {
      console.error("Failed to parse data:", e);
    }
  }
}
let previous = absolute_savings[0];
const daily_savings = absolute_savings.map((num) => {
  const ret = num - previous;
  previous = num;
  return ret;
});

function dayDifference(arr) {
  if (arr.length === 0) return 0;
  const firstDate = new Date(arr[0]);
  const lastDate = new Date(arr[arr.length - 1]);
  const diffTime = lastDate - firstDate;
  const diffDays = diffTime / (1000 * 60 * 60 * 24);
  return diffDays;
}
function savingsDifference(arr) {
  if (arr.length === 0) return 0;
  const firstSaving = arr[0];
  const lastSaving = arr[arr.length - 1];
  return lastSaving - firstSaving;
}
function arrayStats(arr) {
  console.log(arr);
  if (arr.length === 0) return 0;
  const sortedArray = [...arr].sort((a, b) => a - b);
  sortedArray.shift(); // removes the first day entry, since it's always 0
  const index = Math.floor(sortedArray.length / 2);
  const median = sortedArray.length % 2
    ? sortedArray[index]
    : (sortedArray[index - 1] + sortedArray[index]) / 2;
  const min = sortedArray[0];
  const max = sortedArray[sortedArray.length - 1];
  return {min, median, max};
}

(function () {
  const wrapper = document.getElementById("wrapper");
  if (!wrapper) {
    console.error("Wrapper div not found!");
    return;
  }

  const h2Tag = wrapper.querySelector(":scope > h2");
  if (!h2Tag) {
    console.error("No direct child <h2> found inside #wrapper!");
    return;
  }

  const statDiv = document.createElement("div");
  statDiv.classList.add("stat");

  const savingsDiv = document.createElement("div");
  savingsDiv.id = "savings-2";
  savingsDiv.classList.add("line", "ls");

  const labelSpan = document.createElement("span");
  labelSpan.classList.add("c");
  labelSpan.textContent = "Savings Per Day";

  const valueSpan = document.createElement("span");
  valueSpan.classList.add("v");
  const stats = arrayStats(daily_savings);
  valueSpan.textContent = 
    `Average: ${(savingsDifference(absolute_savings)/dayDifference(labels)).toFixed(2)} | Min: ${stats.min} | Median: ${stats.median} | Max: ${stats.max}`;

  savingsDiv.appendChild(labelSpan);
  savingsDiv.appendChild(valueSpan);

  const graphDiv = document.createElement("div");
  graphDiv.classList.add("graph");

  const canvas = document.createElement("canvas");
  canvas.id = "chart-5-2";
  canvas.classList.add("chart");
  const {width, height} = document.getElementById('chart-5')
  canvas.width = width;
  canvas.height = height;
  canvas.style.cssText = document.getElementById('chart-5').style.cssText;

  graphDiv.appendChild(canvas);

  statDiv.appendChild(savingsDiv);
  statDiv.appendChild(graphDiv);

  wrapper.insertBefore(statDiv, h2Tag);

  // chart drawing logic
  const ctx = canvas.getContext("2d");
  const padding = 50;
  const padding_top = 10;
  const chartWidth = canvas.width - padding;
  const chartHeight = canvas.height - padding - padding_top ;

  const maxVal = Math.max(...daily_savings, 10);
  const barWidth = chartWidth / labels.length;

  // bar hitboxes
  const bars = [];

  function drawChart(highlightIndex = null) {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // axes
    ctx.strokeStyle = "#333";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(padding, padding_top);
    ctx.lineTo(padding, canvas.height - padding);
    ctx.lineTo(canvas.width, canvas.height - padding);
    ctx.stroke();

    // horizontal grid lines (draw behind bars)
    ctx.save();
    ctx.strokeStyle = "rgba(0,0,0,0.12)";
    ctx.lineWidth = 1;
    for (let j = 0; j <= 5; j++) {
      const value = (maxVal / 5) * j;
      const y = canvas.height - padding - (value / maxVal) * chartHeight;
      ctx.beginPath();
      ctx.moveTo(padding, y);
      ctx.lineTo(canvas.width - 5, y);
      ctx.stroke();
    }
    ctx.setLineDash([]);
    ctx.restore();

    bars.length = 0;

    // bars
    daily_savings.forEach((val, i) => {
      const x = padding + i * barWidth + (barWidth * 0.2) / 2;
      const height = (val / maxVal) * chartHeight;
      const y = canvas.height - padding - height;

      ctx.fillStyle = i === highlightIndex ? "#FF9933" : "#3366CC";
      ctx.fillRect(x, y, barWidth * 0.8, height);

      bars.push({ x, y, w: barWidth * 0.8, h: height, label: labels[i], value: val });
    });

    // draw a horizontal guide at the top of the highlighted bar
    if (highlightIndex !== null && bars[highlightIndex]) {
      const guideY = bars[highlightIndex].y;
      ctx.save();
      ctx.strokeStyle = "#FF9933";
      ctx.lineWidth = 1;
      ctx.setLineDash([6, 4]);
      ctx.beginPath();
      ctx.moveTo(padding, guideY + 0.5); // +0.5 for crisper 1px line
      ctx.lineTo(canvas.width - 5, guideY + 0.5);
      ctx.stroke();
      ctx.setLineDash([]);
      ctx.restore();
    }

    // x labels
    ctx.fillStyle = getComputedStyle(document.body).color;
    ctx.font = "10px sans-serif";
    labels.forEach((label, i) => {
      if (i % 2 === 0) {
        const x = padding + i * barWidth + barWidth / 2 - 31;
        const y = canvas.height - 5;
        ctx.save();
        ctx.translate(x, y);
        ctx.rotate(-Math.PI / 4);
        ctx.fillText(label, 0, 0);
        ctx.restore();
      }
    });

    // y labels (small ticks only)
    ctx.fillStyle = getComputedStyle(document.body).color;
    ctx.font = "10px sans-serif";
    for (let j = 0; j <= 5; j++) {
      const value = (maxVal / 5) * j;
      const y = canvas.height - padding - (value / maxVal) * chartHeight;
      ctx.fillText(Math.round(value), padding - 30, y + 5);
      ctx.beginPath();
      ctx.moveTo(padding - 5, y);
      ctx.lineTo(padding, y);
      ctx.strokeStyle = "#333";
      ctx.lineWidth = 1;
      ctx.stroke();
    }
  }

  drawChart();

  // tooltip logic
  canvas.addEventListener("mousemove", (e) => {
    const rect = canvas.getBoundingClientRect();
    // scaling because of the style applied to all the canvases in the page
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    const mouseX = (e.clientX - rect.left) * scaleX;
    const mouseY = (e.clientY - rect.top) * scaleY;

    let hoverIndex = null;
    bars.forEach((bar, i) => {
      if (
        mouseX >= bar.x &&
        mouseX <= bar.x + bar.w &&
        mouseY >= bar.y &&
        mouseY <= bar.y + bar.h
      ) {
        hoverIndex = i;
      }
    });

    drawChart(hoverIndex);

    if (hoverIndex !== null) {
      const bar = bars[hoverIndex];
      const tooltipText = `${bar.label}: ${bar.value}`;

      ctx.font = "12px sans-serif";
      const textWidth = ctx.measureText(tooltipText).width + 10;
      const textHeight = 20;

      let tx = mouseX + 10;
      let ty = mouseY - textHeight - 5;
      if (tx + textWidth > canvas.width) tx = canvas.width - textWidth - 5;
      if (ty < 0) ty = mouseY + 20;

      ctx.fillStyle = "rgba(0,0,0,0.7)";
      ctx.fillRect(tx, ty, textWidth, textHeight);

      ctx.fillStyle = "#fff";
      ctx.fillText(tooltipText, tx + 5, ty + 14);
    }
  });

  canvas.addEventListener("mouseleave", () => drawChart());
})();
