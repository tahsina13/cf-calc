import Table from 'react-bootstrap/Table';

import { getInverseTheme, getRatingColor } from '../utils';
import { useTheme } from '../ThemeContext';

export default function ResultTable({ results }) {
  const { theme } = useTheme();
  const labelCellClasses = ['py-3', 'border-start', `border-${getInverseTheme(theme)}`, 'text-start'].join(' ');
  const resultCellClasses = ['py-3', 'border-end', `border-${getInverseTheme(theme)}`, 'text-end'].join(' ');
  if(results) {
    return (
      <Table striped hover size='xl' variant={theme}
        className={`mx-auto border-top border-bottom border-${getInverseTheme(theme)} shadow`}>
        <tbody>
          <tr>
            <th className={labelCellClasses}><span>Results</span></th>
            <th className={resultCellClasses}><span></span></th>
          </tr>
          <tr>
            <td className={labelCellClasses}><span>Expected Rank</span></td>
            <td className={resultCellClasses}><span>{Math.floor(results.seed)}</span></td>
          </tr>
          <tr>
            <td className={labelCellClasses}><span>Actual Rank</span></td>
            <td className={resultCellClasses}><span>{results.rank}</span></td>
          </tr>
          <tr>
            <td className={labelCellClasses}><span>Performance</span></td>
            <td className={resultCellClasses}>
              <span style={{fontWeight: 'bold'}} className={`user-${getRatingColor(results.performance)}`}>
                {results.performance}
              </span>
            </td>
          </tr>
          <tr>
            <td className={labelCellClasses}><span>Rating Change</span></td>
            <td className={resultCellClasses}>
              <span style={{fontWeight: 'bold'}} className={`rating-${results.delta
                ? (results.delta > 0 ? 'increase' : 'decrease') : 'constant'}`}>
                {`${results.delta > 0 ? '+' : ''}${results.delta}`}
              </span>
            </td>
          </tr>
        </tbody>
      </Table>
    );
  } else {
    return <></>;
  }
}
