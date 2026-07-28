/*
 * SPDX-FileCopyrightText: 2026 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import React, { type Dispatch, type SetStateAction, useCallback, useMemo, useState } from 'react';

import { INSERT_TABLE_COMMAND } from '@lexical/table';
import { type DropdownItem } from '@zextras/carbonio-design-system';
import { t } from '@zextras/carbonio-shell-ui';
import { type LexicalEditor } from 'lexical';

import { TableGridPicker } from '../table-grid-picker';

type TableInsert = {
	insertTable: (rows: number, columns: number) => void;
	tableItems: Array<DropdownItem>;
	tableLabel: string;
	tableMenuOpen: boolean;
	setTableMenuOpen: Dispatch<SetStateAction<boolean>>;
};

export function useTableInsert(editor: LexicalEditor): TableInsert {
	const [tableMenuOpen, setTableMenuOpen] = useState(false);

	const insertTable = useCallback(
		(rows: number, columns: number): void => {
			editor.dispatchCommand(INSERT_TABLE_COMMAND, {
				rows: String(rows),
				columns: String(columns),
				includeHeaders: false
			});
			setTableMenuOpen(false);
		},
		[editor]
	);

	const tableLabel = t('lexical-label.table', 'Table');

	const tableItems = useMemo<Array<DropdownItem>>(
		() => [
			{
				id: 'table-grid',
				label: tableLabel,
				keepOpen: true,
				customComponent: <TableGridPicker onSelect={insertTable} />
			}
		],
		[insertTable, tableLabel]
	);

	return { insertTable, tableItems, tableLabel, tableMenuOpen, setTableMenuOpen };
}
