import React from 'react';

export function EmptyRow(): React.ReactNode {
  return (
    <tr>
      <td colSpan={3}>&nbsp;</td>
    </tr>
  );
}
