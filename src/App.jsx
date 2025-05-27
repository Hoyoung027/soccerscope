import { useState, useEffect } from 'react';
import * as d3 from 'd3'
import './App.css';


function App() {
	// Define state variables.
	const [items, setItems] = useState([]);
	const [hovered, setHovered] = useState(null);  
	const [selected, setSelected] = useState(null);
	const [trueFilter, setTrueFilter] = useState(null); 
	const [predFilter, setPredFilter] = useState(null); 

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

	// Projection View
	useEffect(() => {
		if (items.length == 0) return;

		const svg = d3.select('#projection-view svg')
			.attr('width', 370)
			.attr('height', 330);

		svg.selectAll('circle').remove();

		const focus = selected || hovered;

		const xExtent = d3.extent(items, d => d.projection[0]);
		const yExtent = d3.extent(items, d => d.projection[1]);

		const xScale = d3.scaleLinear()
		.domain(xExtent).range([20, 350]);
		
		const yScale = d3.scaleLinear()
			.domain(yExtent).range([250, 50]);

		const color = d3.scaleOrdinal()
			.domain(d3.range(10))
			.range(d3.schemeCategory10);
		
		svg.selectAll('circle')
			.data(items)
			.enter()
			.append('circle')
				.attr('cx', d => xScale(d.projection[0]))
				.attr('cy', d => yScale(d.projection[1]))
				.attr('r', 3)
				.attr('fill', d => color(d.true_label))
				.attr('stroke', d => color(d.predicted_label))
				.attr('stroke-width', 1)
				.attr('opacity', 0.6)
				.on('mouseover', (event, d) => setHovered(d))
				.on('mouseout', () => setHovered(null))
				.on('click', (event, d) => {
					setSelected(prev => prev && prev.id === d.id ? null : d);
				})
	}, [items]);


	// Score Distribution 
	useEffect(() => {
	if (!items.length) return;

	const svg = d3.select('#score-distribution svg')
		.attr('width', 960)
		.attr('height', 600);
	svg.selectAll('*').remove();

	const margin = { top: 30, left: 80, right: 20, bottom: 20 };
	const width  = +svg.attr('width') - margin.left - margin.right;
	const height = +svg.attr('height') - margin.top  - margin.bottom;
	const rowH   = height / 10;
	const imgS   = 8;
	const pad    = 2;

	// 상단 축 그리기
	const xScale = d3.scaleLinear()
		.domain([0, 1])
		.range([margin.left, margin.left + width]);
		
	const axisG = svg.append('g')
		.attr('transform', `translate(0,${margin.top})`)
		.call(d3.axisTop(xScale)
		.ticks(10)
		.tickFormat(d3.format('.1f')));


	axisG.selectAll('.domain')
		.attr('stroke', '#ccc');

	axisG.selectAll('line')
 		.attr('stroke', '#ccc');

	axisG.selectAll('text')
 		.attr('fill', '#666');


	// 클래스별 색상 지정
	const color = d3.scaleOrdinal()
		.domain(d3.range(10))
		.range(d3.schemeCategory10);

	// 눈금 값
	const tickValues = d3.range(0, 1.01, 0.1);

	// 클래스 0~9 선선 그리기
	for (let i = 0; i < 10; i++) {
		const y0 = margin.top + rowH * i + rowH / 2;

		svg.append('line')
		.attr('x1', margin.left)
		.attr('x2', margin.left + width)
		.attr('y1', y0 + 16)
		.attr('y2', y0 + 16)
		.attr('stroke', '#ccc');

		// 눈금 추가
		tickValues.forEach(v => {
		const x = xScale(v);
		svg.append('line')
			.attr('x1', x)
			.attr('x2', x)
			.attr('y1', y0 + 16 - 4)
			.attr('y2', y0 + 16)
			.attr('stroke', '#ccc');
		});

		// 텍스트
		svg.append('text')
			.attr('x', margin.left - 10)
			.attr('y', y0 - 6)
			.attr('text-anchor', 'end')
			.attr('fill', '#666')
			.text(`Class ${i}`);

		svg.append('text')
			.attr('class', 'filter-label')
			.attr('data-class', i)
			.attr('x', margin.left - 10)
			.attr('y', y0 + 4)
			.attr('text-anchor', 'end')
			.style('font-size', '10px')
			.style('cursor','pointer')
			.text(`Labeled as ${i}`)
			.on('click', () => setTrueFilter(prev => prev === i ? null : i));
		
		svg.append('text')
			.attr('class', 'filter-pred')
			.attr('data-class', i)
			.attr('x', margin.left - 10)
			.attr('y', y0 + 16)
			.attr('text-anchor', 'end')
			.style('font-size', '10px')
			.style('cursor','pointer')
			.text(`Predicted as ${i}`)
			.on('click', () => setPredFilter(prev => prev === i ? null : i));

		// 클래스 데이터 10개로 분할
		const clsItems = items.filter(d => d.true_label === i);
		const bins = d3.bin()
			.domain([0, 1])
			.thresholds(10)
			.value(d => d.predicted_scores[i])
			(clsItems);


		// 작은 박스형 이미지들 (col, row) 계산 후 격자 배치
		bins.forEach(bin => {
			const x0 = xScale(bin.x0);
			const bw = xScale(bin.x1) - xScale(bin.x0);

			// 최대 8개 컬럼
			const maxCols = 8;
			const nCol = Math.min(maxCols, Math.max(1, Math.floor((bw - pad) / (imgS + pad))));

			bin.forEach((d, idx) => {
				const col = idx % nCol;
				const row = Math.floor(idx / nCol);

				// 각 cell의 좌표
				const cellX = x0 + col * (imgS + pad) + 4;
				const cellY = (y0+16-imgS-2) - row * (imgS + pad);

				// 배경용 사각형
				svg.append('rect')
					.classed('cell', true)
					.datum(d)
					.attr('x', cellX)
					.attr('y', cellY)
					.attr('width', imgS)
					.attr('height', imgS)
					.attr('fill', color(d.true_label))
					.attr('stroke', color(d.predicted_label))
					.attr('stroke-width', 1)
					.on('click', (event, d) => {
						event.stopPropagation();            
						setSelected(prev => prev && prev.id === d.id ? null : d);
						setTrueFilter(null);
						setPredFilter(null);
					})
					.on('mouseover', (e, d) => setHovered(d))
					.on('mouseout', ()    => setHovered(null));
					

				// 실제 이미지 삽입 
				svg.append('image')
					.classed('cell', true)
					.datum(d)
					.attr('href', `/images/${d.filename}`)
					.attr('x', cellX)
					.attr('y', cellY)
					.attr('width', imgS)
					.attr('height', imgS)
					.on('click', (event, d) => {
						event.stopPropagation();
						setSelected(prev => prev && prev.id === d.id ? null : d);
						setTrueFilter(null);
						setPredFilter(null);
					})
					.on('mouseover', (e, d) => setHovered(d))
					.on('mouseout', ()    => setHovered(null));
			});
		});
	}
	}, [items]);


	// Hover, Select, Filter
	useEffect(() => {

		const focus = selected || hovered;

		 // 1) Projection View
		d3.select('#projection-view svg').selectAll('circle')
			.attr('opacity', d => {
			if (selected) {
				return d.id === selected.id ? 1 : 0.1;
			}
			if (trueFilter !== null) {
				if (predFilter !== null) {
				return (d.true_label === trueFilter && d.predicted_label === predFilter)
					? 1 : 0.1;
				}
				return d.true_label === trueFilter ? 1 : 0.1;
			}
			if (predFilter !== null) {
				return d.predicted_label === predFilter ? 1 : 0.1;
			}
			if (hovered) {
				return d.id === hovered.id ? 1 : 0.1;
			}
			return 0.6;
			})
			.attr('r', d => 
			selected
				? (d.id === selected.id ? 6 : 3)
				: (hovered && d.id === hovered.id ? 6 : 3)
			);

		// 2) Score Distribution View
		d3.select('#score-distribution svg').selectAll('rect.cell, image.cell')
			.attr('opacity', d => {
			if (selected) {
				return d.id === selected.id ? 1 : 0.1;
			}
			if (trueFilter !== null) {
				if (predFilter !== null) {
				return (d.true_label === trueFilter && d.predicted_label === predFilter)
					? 1 : 0.1;
				}
				return d.true_label === trueFilter ? 1 : 0.1;
			}
			if (predFilter !== null) {
				return d.predicted_label === predFilter ? 1 : 0.1;
			}
			if (hovered) {
				return d.id === hovered.id ? 1 : 0.1;
			}
			return 1;
			});

			d3.selectAll('.filter-label')
				.style('text-decoration', function() {
					return +d3.select(this).attr('data-class') === trueFilter
					? 'underline'
					: 'none';
				});

			d3.selectAll('.filter-pred')
				.style('text-decoration', function() {
					return +d3.select(this).attr('data-class') === predFilter
					? 'underline'
					: 'none';
				});

	}, [hovered, selected, trueFilter, predFilter]);

	useEffect(() => {
		const ssvg = d3.select('#score-distribution svg');
		// 1) 이전에 그린 그래프 지우기
		ssvg.selectAll('.focus-line').remove();

		// 2) 포커스 대상 (선택된(selected) or 호버된(hovered))
		const focus = selected || hovered;
		if (!focus) return;

		// 3) 레이아웃 재계산
		const margin = { top: 30, left: 80, right: 20, bottom: 20 };
		const svgW = +ssvg.attr('width');
		const svgH = +ssvg.attr('height');
		const width = svgW - margin.left - margin.right;
		const height = svgH - margin.top  - margin.bottom;
		const rowH = height / 10;

		// 4) xScale 재정의 (0–1 → 화면 좌표)
		const xScale = d3.scaleLinear()
			.domain([0, 1])
			.range([margin.left, margin.left + width]);

		// 5) line generator: stepBefore curve
		const lineGen = d3.line()
			.x(d => xScale(d))
			.y((d, i) => 
				margin.top     
				+ rowH * (i-1)    
				+ rowH / 2    
				+ 16          
			)
			.curve(d3.curveStepBefore);

		// 6) path 그리기
		ssvg.append('path')
			.datum(focus.predicted_scores)
			.attr('class', 'focus-line')
			.attr('d', lineGen)
			.attr('stroke', 'black')
			.attr('stroke-width', 1.5)
			.attr('fill', 'none');

		const score9 = focus.predicted_scores[9];
		const x9 = xScale(score9);
		// 클래스 9 행의 중앙 위치 계산 (i=9)
		const yCenter9 = margin.top + rowH * 9 + rowH / 2 + 16;
		ssvg.append('line')
			.attr('class', 'focus-line')
			.attr('x1', x9).attr('x2', x9)
			.attr('y1', yCenter9 - rowH/2 - 28)
			.attr('y2', yCenter9 + rowH/2 - 28)
			.attr('stroke', 'black')
			.attr('stroke-width', 1.5);

	}, [selected, hovered]);


	return (
	<>
		<h1>Data Visualization HW 3 Sample</h1>

		<div id="container">
		<div id="sidebar">
			<div id="projection-view" className="view-panel">
			<div className="view-title">Projection View</div>
			<svg />
			</div>
			<div id="selected-image-info" className="view-panel">
			<div className="view-title">Selected Image</div>
			<div id="selected-image-info-content">
				{ (selected || hovered) ? (() => {
					const focus = selected || hovered;
					return (
					<>
						<img 
						src={`/images/${focus.filename}`} 
						width={80} 
						height={80} 
						alt={`img-${focus.id}`} 
						/>
						<div className="selected-info">
						<div className="info-line">ID: {focus.id}</div>
						<div className="info-line">Labeled as {focus.true_label}</div>
						<div className="info-line">
							Predicted as {focus.predicted_label}
							<span className="confidence">
							&nbsp;(Confidence: {focus.predicted_scores[focus.predicted_label].toFixed(3)})
							</span>
						</div>
						</div>
						<svg id="parallel-coords" width={80} height={100} />
					</>
					);
				})()
				: null }
			</div>
			</div>
		</div>

		<div id="main-section">
			<div id="score-distribution" className="view-panel">
			<div className="view-title">Score Distributions</div>
			<svg />
			</div>
		</div>
		</div>
	</>
	);
}

export default App;
