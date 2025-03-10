
const values = [5000, 10000, 3000, 7000];  
const firstCategories = ["High Yield", "Global Index", "Bonds", "Value Stocks"];
const secondCategories = ["Interest", "Shares", "Stock", "Shares"];

function buildHierarchy(values, firstCategories, secondCategories) {
    let root = { name: "Investments", children: [] };
    let categoryMap = {};

    for (let i = 0; i < values.length; i++) {
        let broadCategory = secondCategories[i];  // Outer ring
        let specificCategory = firstCategories[i];  // Inner ring
        let value = values[i];

        // Ensure broad category exists
        if (!categoryMap[broadCategory]) {
            categoryMap[broadCategory] = { name: broadCategory, children: [] };
            root.children.push(categoryMap[broadCategory]);
        }

        // Add specific category under broad category
        categoryMap[broadCategory].children.push({ name: specificCategory, value: value });
    }
    return root;
}

// Convert the arrays into hierarchical data
const data = buildHierarchy(values, firstCategories, secondCategories);
console.log("Transformed Data:", JSON.stringify(data, null, 2)); // Debugging output

// Hardcoded hierarchy structure
// const data = {
//     name: "Investments",
//     children: [
//         {
//             name: "Interest",  // Broad category (Outer Ring)
//             children: [
//                 { name: "Bonds", value: 3000 },  // Specific investment (Inner Ring)
//                 { name: "High Yield", value: 5000 }
//             ]
//         },
//         {
//             name: "Shares",  // Broad category (Outer Ring)
//             children: [
//                 { name: "Global Index", value: 10000 },
//                 { name: "Value Stocks", value: 7000 }
//             ]
//         },
//         {
//             name: "Stock",  // Broad category (Outer Ring)
//             children: [
//                 { name: "Bonds", value: 3000 }  // Shared name to test handling
//             ]
//         }
//     ]
// };

// 1️⃣ Create D3 hierarchy
const root = d3.hierarchy(data).sum(d => d.value);

const width = 600, height = 600;
const radius = Math.min(width, height) / 2;  // Ensure it scales properly

// 2️⃣ Set up partition layout
const partition = d3.partition().size([2 * Math.PI, 1]); // Normalize y-values to 0-1

partition(root);

// 3️⃣ Create SVG Container
const svg = d3.select("body").append("svg")
    .attr("width", width)
    .attr("height", height)
    .attr("viewBox", `0 0 ${width} ${height}`)  // Standard SVG size
    .style("border", "2px solid red")  // Debugging border

// This ensures the sunburst is drawn in the **exact center** of the SVG
const svgGroup = svg.append("g")
    .attr("transform", `translate(${width / 2}, ${height / 2})`);


//d3.select("svg").style("border", "2px solid red");


// 4️⃣ Define Arc Generator
const arc = d3.arc()
    .startAngle(d => d.x0)
    .endAngle(d => d.x1)
    .innerRadius(d => d.y0 * radius)  // Scale correctly
    .outerRadius(d => d.y1 * radius); // Ensure max radius is respected


//5️⃣ Draw Sunburst
svgGroup.selectAll("path")
  .data(root.descendants().slice(1))  // Exclude root node
  .enter().append("path")
  .attr("d", arc)
  .style("fill", (d, i) => d3.schemeCategory10[i % 10])  // Color each segment
  .style("stroke", "#fff");

  svgGroup.selectAll("text")
  .data(root.descendants().slice(1))  // Exclude root node
  .enter().append("text")
  .attr("transform", d => {
      const x = (d.x0 + d.x1) / 2 * 180 / Math.PI;  // Midpoint angle
      const y = (d.y0 + d.y1) / 2 * radius * 0.8;  // Midpoint radius
      return `translate(${arc.centroid(d)}) rotate(${x - 90})`;
  })
  .attr("dy", "0.35em")  // Align text correctly
  .attr("text-anchor", "middle")  // Center text alignment
  .text(d => d.data.name)  // Use category name as label
  .style("font-size", "12px")
  .style("fill", "#000")  // Set text color
  .style("pointer-events", "none");  // Prevent text from blocking hover effects



console.log("SVG Created:", svg);
console.log("Number of Paths:", svg.selectAll("path").size());


console.log("Hardcoded sunburst should now be visible.");
