let labelMode = "value";  // Options: "category", "value", "percentage"

const values = [5000, 10000, 3000, 7000];
const firstCategories = ["High Yield", "Global Index", "Bonds", "Value Stocks"];
const secondCategories = ["Interest", "Shares", "Interest", "Shares"];

// Compute average values upfront
const totalSum = values.reduce((sum, val) => sum + val, 0);
const averageValues = values.map(val => val / totalSum * 100);

function buildHierarchy(valuesArray, firstCategories, secondCategories) {
    let root = { name: "Investments", children: [] };
    let categoryMap = {};

    for (let i = 0; i < valuesArray.length; i++) {
        let broadCategory = secondCategories[i];
        let specificCategory = firstCategories[i];
        let value = valuesArray[i];

        if (!categoryMap[broadCategory]) {
            categoryMap[broadCategory] = {
                name: broadCategory,
                children: [],
                totalValue: 0,
                count: 0
            };
            root.children.push(categoryMap[broadCategory]);
        }

        categoryMap[broadCategory].children.push({
            name: specificCategory,
            value: value
        });

        categoryMap[broadCategory].totalValue += value;
        categoryMap[broadCategory].count += 1;
    }
    return root;
}

// Function to update the sunburst visualization
function updateSunburst() {
    svgGroup.selectAll("text")
        .text(d => {
            if (labelMode === "category") return d.data.name;
            if (labelMode === "value") return d.children ? `${d.data.totalValue.toFixed(2)}` : `${d.data.value.toFixed(2)}`;
            if (labelMode === "percentage") return d.children ? `${(d.data.totalValue / totalSum * 100).toFixed(2)}%` : `${(d.data.value / totalSum * 100).toFixed(2)}%`;
            return "";
        });
}

// Function to change label mode and refresh chart
function setLabelMode(mode) {
    labelMode = mode;
    updateSunburst();
}

// Initial dataset transformation
let data = buildHierarchy(values, firstCategories, secondCategories);
const root = d3.hierarchy(data).sum(d => d.value);
const width = 600, height = 600;
const radius = Math.min(width, height) / 2;

// Partition layout
const partition = d3.partition().size([2 * Math.PI, 1]);
partition(root);

// Create SVG
const svg = d3.select("body").append("svg")
    .attr("width", width)
    .attr("height", height)
    .attr("viewBox", `0 0 ${width} ${height}`)
    .style("border", "2px solid red");

const svgGroup = svg.append("g")
    .attr("transform", `translate(${width / 2}, ${height / 2})`);

// Arc generator
const arc = d3.arc()
    .startAngle(d => d.x0)
    .endAngle(d => d.x1)
    .innerRadius(d => d.y0 * radius)
    .outerRadius(d => d.y1 * radius);

// Draw Sunburst
svgGroup.selectAll("path")
    .data(root.descendants().slice(1))
    .enter().append("path")
    .attr("d", arc)
    .style("fill", (d, i) => d3.schemeCategory10[i % 10])
    .style("stroke", "#fff");

// Draw Labels
svgGroup.selectAll("text")
    .data(root.descendants().slice(1))
    .enter().append("text")
    .attr("transform", d => {
        const angle = (d.x0 + d.x1) / 2 * 180 / Math.PI;
        const inner = d.y0 * radius;
        const outer = d.y1 * radius;
        const labelRadius = (inner + outer) / 2;
        return `translate(${labelRadius * Math.cos((angle - 90) * Math.PI / 180)}, 
                           ${labelRadius * Math.sin((angle - 90) * Math.PI / 180)}) rotate(${angle - 90})`;
    })
    .attr("dy", "0.35em")
    .attr("text-anchor", "middle")
    .text(d => {
        if (labelMode === "category") return d.data.name;
        if (labelMode === "value") return d.children ? `${d.data.totalValue.toFixed(2)}` : `${d.data.value.toFixed(2)}`;
        if (labelMode === "percentage") return d.children ? `${(d.data.totalValue / totalSum * 100).toFixed(2)}%` : `${(d.data.value / totalSum * 100).toFixed(2)}%`;
        return "";
    })
    .style("font-size", "12px")
    .style("fill", "#000")
    .style("pointer-events", "none");

// Add UI buttons
d3.select("body").append("div").html(`
    <button onclick="setLabelMode('category')">Show Categories</button>
    <button onclick="setLabelMode('value')">Show Values</button>
    <button onclick="setLabelMode('percentage')">Show Percentages</button>
`);

console.log("SVG Created:", svg);
console.log("Number of Paths:", svg.selectAll("path").size());
console.log("Updated sunburst should now be visible.");
