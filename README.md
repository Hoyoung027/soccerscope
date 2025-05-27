[![Review Assignment Due Date](https://classroom.github.com/assets/deadline-readme-button-22041afd0340ce965d47ae6ef1cefeee28c7c493a6346c4f15d667ab976d596c.svg)](https://classroom.github.com/a/XqiWbVsP)
# Data Visualization HW 3

You must fill out the following form. Please see LearnUs for detailed instructions.

---
- Name: 변호영
- URL to video demo: https://youtu.be/591nNjdycN8
- Optional comment: 
- ChatGPT 사용 내역

## 1. 축(Axis) 스타일링 변경하기  
**질문**  
> 상단 0.0–1.0 축의 선 색을 `#ccc`보다 더 진한 회색으로 바꿀 수 있을까요?  

**답변 요약**  
```js
axisG.selectAll('.domain')
  .attr('stroke', '#999');
axisG.selectAll('line')
  .attr('stroke', '#999');
axisG.selectAll('text')
  .attr('fill', '#666');
```

## 2. 썸네일 박스 채우기 및 테두리 지정  
**질문**  
> 각 작은 이미지를 true label 색으로 채우고, predicted label 색으로 테두리 표시하려면?
```js
svg.append('rect')
   .attr('fill', color(d.true_label))       // 배경 색
   .attr('stroke', color(d.predicted_label)) // 테두리 색
   // …;

svg.append('image')
   .attr('href', `/images/${d.filename}`)
   // …;
```

## 3. select로 점 강조
**질문**
> Projection View에서 점 하나를 클릭하면 그 점만 크게, 나머지는 반투명 유지하게 할 수 있나요?

```js
// 클릭 시 selected 상태 업데이트
.on('click', (e,d) => {
  setSelected(prev => prev && prev.id===d.id ? null : d);
});

// useEffect에서 반영
psvg.selectAll('circle')
    .attr('opacity', d =>
      selected ? (d.id===selected.id ? 1 : 0.1) : 0.6
    )
    .attr('r', d =>
      selected && d.id===selected.id ? 6 : 3
    );

```

## 4. “Labeled as i” / “Predicted as k” 필터링
**질문**
> 클래스 텍스트를 클릭하면 해당 true_label=i 또는 predicted_label=k만 필터링, 다시 클릭 시 해제되게 만들고 싶어요.

```js
// 텍스트 클릭
.on('click', () => setTrueFilter(prev => prev===i? null : i));

// opacity 로직
.attr('opacity', d => {
  if (trueFilter!==null)   return d.true_label===trueFilter?1:0.1;
  if (predFilter!==null)   return d.predicted_label===predFilter?1:0.1;
  if (selected)            return d.id===selected.id?1:0.1;
  if (hovered)             return d.id===hovered.id?1:0.1;
  return defaultOpacity;
});
```

---

This repository contains the skeleton code used in the Data Visualization course at Yonsei University taught by Prof. Minsuk Kahng.

The digits dataset is from https://archive.ics.uci.edu/ml/datasets/Optical+Recognition+of+Handwritten+Digits through scikit-learn.
