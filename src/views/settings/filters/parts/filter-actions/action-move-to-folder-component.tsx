/*
 * SPDX-FileCopyrightText: 2025 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import React, { useCallback } from 'react';

import { Folder } from '@zextras/carbonio-ui-commons';
import { noop } from 'lodash';

import { FilterFileInto } from 'types/filters';
import { MovetoFolder } from 'views/settings/filters/parts/filter-actions/move-to-folder';
import { ActionComponentProps } from 'views/settings/filters/types';

export const ActionMoveToFolderComponent = ({
	value,
	onChange
}: ActionComponentProps<FilterFileInto>): React.JSX.Element => {
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
