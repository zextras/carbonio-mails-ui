/*
 * SPDX-FileCopyrightText: 2025 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import React from 'react';

import { Dropdown, Row, Padding } from '@zextras/carbonio-design-system';

import { useFolderActions } from './use-folder-actions';
import { Folder } from '../../carbonio-ui-commons/types/folder';

type FolderActionWrapperProps = {
	folder: Folder;
	children?: React.JSX.Element;
};
export const FolderActionWrapper = ({
	folder,
	children
}: FolderActionWrapperProps): React.JSX.Element => {
	const dropdownItems = useFolderActions(folder);

	return (
		<Dropdown
			data-testid={`folder-context-menu-${folder.id}`}
			contextMenu
			items={dropdownItems}
			display="block"
			width="100%"
		>
			<Row>
				<Padding left="small" />
				{children}
			</Row>
		</Dropdown>
	);
};
