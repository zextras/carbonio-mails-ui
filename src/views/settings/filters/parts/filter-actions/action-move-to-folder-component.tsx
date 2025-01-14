/*
 * SPDX-FileCopyrightText: 2025 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import React, { useCallback } from 'react';

import { noop } from 'lodash';

import { MovetoFolder } from './move-to-folder';
import { FilterAction, FilterFileInto, Folder } from '../../../../../types';

type ActionMoveToFolderComponentProps = {
	value: FilterFileInto;
	onChange: (filterValue: FilterAction) => void;
};
export const ActionMoveToFolderComponent = ({
	value,
	onChange
}: ActionMoveToFolderComponentProps): React.JSX.Element => {
	const defaultMoveToFolder = { name: value.actionFileInto[0].folderPath };
	const confirmMoveToFolder = useCallback(
		(folderDestination: Folder | undefined) => {
			onChange({
				actionFileInto: [{ folderPath: `${folderDestination?.absFolderPath}` }]
			});
		},
		[onChange]
	);
	return (
		<MovetoFolder
			destination={defaultMoveToFolder}
			onSelectFolder={noop}
			onConfirmDestination={confirmMoveToFolder}
		/>
	);
};
