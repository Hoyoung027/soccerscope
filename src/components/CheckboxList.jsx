// src/components/CheckboxList.jsx
import React from 'react';

export default function CheckboxList({
  allColumns,       // ['Gls','Ast','xG', …, 'Recov']
  selectedColumns,  // 부모에서 관리하는 상태 배열
  onChange          // 선택이 바뀔 때 호출되는 함수
}) {
  const MAX_SELECT = 5;

  const toggleColumn = (col) => {
    // 이미 선택된 컬럼이면 무조건 해제
    if (selectedColumns.includes(col)) {
      onChange(selectedColumns.filter(c => c !== col));
    } else {
      // 새로 추가하려 할 때, 이미 5개가 선택돼 있으면 경고만 띄우고 리턴
      if (selectedColumns.length >= MAX_SELECT) {
        alert(`최대 ${MAX_SELECT}개까지만 선택 가능합니다.`);
        return;
      }
      onChange([...selectedColumns, col]);
    }
  };

  return (
    <div>
      {allColumns.map((col, i) => (
        <div key={i} style={{ marginBottom: '4px' }}>
          <label style={{ cursor: 'pointer' }}>
            <input
              type="checkbox"
              checked={selectedColumns.includes(col)}
              onChange={() => toggleColumn(col)}
            />{' '}
            {col}
          </label>
        </div>
      ))}
    </div>
  );
}
