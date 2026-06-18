/*
 * SPDX-FileCopyrightText: 2026 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import React, { useState } from 'react';

import styled from '@emotion/styled';
import { Container, Text } from '@zextras/carbonio-design-system';
import { t } from '@zextras/carbonio-shell-ui';

const GRID_SIZE = 10;

const Grid = styled.div<{ $rows: number; $columns: number }>`
	display: grid;
	grid-template-columns: repeat(${({ $columns }): number => $columns}, 1rem);
	grid-template-rows: repeat(${({ $rows }): number => $rows}, 1rem);
	gap: 0.125rem;
`;

const Cell = styled.div<{ $active: boolean }>`
	width: 1rem;
	height: 1rem;
	box-sizing: border-box;
	cursor: pointer;
	border: 0.0625rem solid ${({ theme }): string => theme.palette.gray3.regular};
	background: ${({ $active, theme }): string =>
		$active ? theme.palette.primary.regular : theme.palette.gray6.regular};
`;

export type TableGridPickerProps = {
	maxRows?: number;
	maxColumns?: number;
	onSelect: (rows: number, columns: number) => void;
};

/**
 * Visual NxM size picker for table insertion. Hovering highlights the top-left
 * rectangle up to the hovered cell and shows
 * the selected dimensions; clicking commits them through `onSelect`.
 */
export const TableGridPicker = ({
	maxRows = GRID_SIZE,
	maxColumns = GRID_SIZE,
	onSelect
}: TableGridPickerProps): React.JSX.Element => {
	const [hoveredRows, setHoveredRows] = useState(0);
	const [hoveredColumns, setHoveredColumns] = useState(0);

	return (
		<Container
			mainAlignment="flex-start"
			crossAlignment="flex-start"
			data-testid="table-grid-picker"
		>
			<Grid
				$rows={maxRows}
				$columns={maxColumns}
				onMouseLeave={(): void => {
					setHoveredRows(0);
					setHoveredColumns(0);
				}}
			>
				{Array.from({ length: maxRows }, (_, rowIndex) =>
					Array.from({ length: maxColumns }, (__, columnIndex) => {
						const row = rowIndex + 1;
						const column = columnIndex + 1;
						return (
							<Cell
								key={`${row}-${column}`}
								$active={row <= hoveredRows && column <= hoveredColumns}
								data-testid={`table-grid-cell-${row}-${column}`}
								onMouseEnter={(): void => {
									setHoveredRows(row);
									setHoveredColumns(column);
								}}
								onClick={(): void => onSelect(row, column)}
							/>
						);
					})
				)}
			</Grid>
			<Text size="small">
				{hoveredRows > 0
					? t('label.table_size', '{{rows}} x {{columns}}', {
							rows: hoveredRows,
							columns: hoveredColumns
						})
					: t('label.insert_table', 'Insert table')}
			</Text>
		</Container>
	);
};
