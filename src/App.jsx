import { useState, useEffect } from 'react';

import './App.css';

function App() {
	// Define state variables.
	const [items, setItems] = useState([]);

	useEffect(() => {
		fetch('predictions.json')
			.then((response) => response.json())
			.then((jsonData) => {
				// Print data into console for debugging.
				console.log(jsonData);

				// Save data items to state.
				setItems(jsonData);

				// Preprocess data.

			})
			.catch((error) => {
				console.error('Error loading JSON file:', error);
			});
	}, []);

	// Prep.


	return (
		<>
			<h1>Data Visualization HW 3 Sample</h1>

			<div id="container">
				<div id="sidebar">
					<div id="projection-view" className="view-panel">
						<div className="view-title">Projection View</div>
						<svg >
							

						</svg>
					</div>
					<div id="selected-image-info" className="view-panel">
						<div className="view-title">Selected Image</div>
						<div id="selected-image-info-content">
							
							
						</div>
					</div>
				</div>

				<div id="main-section">
					<div id="score-distribution" className="view-panel">
						<div className="view-title">Score Distributions</div>
						
						<svg >
							

						</svg>
					</div>
				</div>
			</div>
		</>
	);
}
export default App;
