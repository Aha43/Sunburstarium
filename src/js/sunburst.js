
let labelMode = "value";  // Options: "category", "value", "percentage"


function getQueryParam(name) {
    const params = new URLSearchParams(window.location.search);
    const rawValue = params.get(name);

    console.log(`Query param [${name}]:`, rawValue); // Debugging output

    let retVal = rawValue ? JSON.parse(decodeURIComponent(rawValue)) : null;

    console.log(`  Parsed [${name}]:`, retVal); // Debugging output
    return retVal;
}

// Extract title from the query string (default: "Sunburst Diagram")
const diagramTitle = getQueryParam("title") || "Sunburst";

// Extract values & categories from the query string
const values = getQueryParam("data") || [5000, 10000, 3000, 7000];
const categoryLevels = getQueryParam("categories") || [
    ["High Yield", "Global Index", "Bonds", "Value Stocks"],
    ["Interest", "Shares", "Interest", "Shares"]
];

const totalSum = values.reduce((sum, val) => sum + val, 0);
const averageValues = values.map(val => val / totalSum * 100);


function buildHierarchy(valuesArray, categoryLevels) {
    let root = { name: "Investments", children: [] };

    for (let i = 0; i < valuesArray.length; i++) {
        let value = valuesArray[i];
        let currentLevel = root;

        // Traverse category levels dynamically
        for (let level = 0; level < categoryLevels.length; level++) {
            let category = categoryLevels[level][i];

            // Check if category already exists in the current level
            let existing = currentLevel.children.find(child => child.name === category);
            if (!existing) {
                existing = { name: category, children: [], totalValue: 0 };
                currentLevel.children.push(existing);
            }

            // Move deeper in hierarchy
            currentLevel = existing;
            currentLevel.totalValue += value;
        }

        // Assign final value to leaf node
        currentLevel.value = value;
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
let data = buildHierarchy(values, categoryLevels);
const root = d3.hierarchy(data).sum(d => d.value);
const width = 600, height = 600;
const radius = Math.min(width, height) / 2;

const colorScale = d3.scaleOrdinal(d3.schemeCategory10); // Consistent color scheme
const categoryColorMap = {}; // Store assigned colors

function getCategoryColor(category) {
    if (!categoryColorMap[category]) {
        categoryColorMap[category] = colorScale(Object.keys(categoryColorMap).length);
    }
    return categoryColorMap[category];
}

// Partition layout
const partition = d3.partition().size([2 * Math.PI, 1]);
partition(root);

// Create SVG
const svg = d3.select("body").append("svg")
    .attr("width", width)
    .attr("height", height)
    .attr("viewBox", `0 0 ${width} ${height}`);

const svgGroup = svg.append("g")
    .attr("transform", `translate(${width / 2}, ${height / 2})`);




// Arc generator
const arc = d3.arc()
    .startAngle(d => d.x0)
    .endAngle(d => d.x1)
    .innerRadius(d => d.y0 * radius)
    .outerRadius(d => d.y1 * radius);

// Create title in SVG
svgGroup.append("text")
    .attr("text-anchor", "middle")
    .attr("dy", "-280") // Position title above the sunburst
    .style("font-size", "24px")
    .style("font-weight", "bold")
    .text(diagramTitle);

// Draw Sunburst
svgGroup.selectAll("path")
    .data(root.descendants().slice(1))
    .enter().append("path")
    .attr("d", arc)
    .style("fill", (d, i) => d3.schemeCategory10[i % 10])
    .style("fill", d => getCategoryColor(d.data.name))
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

// Select the tooltip div
const tooltip = d3.select("#tooltip");

// Add tooltip event listeners to sunburst paths
svgGroup.selectAll("path")
    .on("mouseover", function (event, d) {
        tooltip.style("opacity", 1)
            .html(`
                <strong>${d.data.name}</strong><br>
                ${labelMode === "value" ? `Value: ${d.data.totalValue || d.data.value}` : ""}
                ${labelMode === "percentage" ? `(${((d.data.totalValue || d.data.value) / totalSum * 100).toFixed(2)}%)` : ""}
            `);
    })
    .on("mousemove", function (event) {
        tooltip.style("left", (event.pageX + 10) + "px")
            .style("top", (event.pageY - 20) + "px");
    })
    .on("mouseout", function () {
        tooltip.style("opacity", 0);
    });


// Add UI buttons
d3.select("body").append("div").html(`
    <button onclick="setLabelMode('category')">Show Categories</button>
    <button onclick="setLabelMode('value')">Show Values</button>
    <button onclick="setLabelMode('percentage')">Show Percentages</button>
`);

console.log("SVG Created:", svg);
console.log("Number of Paths:", svg.selectAll("path").size());
console.log("Updated sunburst should now be visible.");
