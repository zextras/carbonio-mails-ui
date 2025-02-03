/*
 * SPDX-FileCopyrightText: 2025 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import React from 'react';

import { Dropdown, Row, Padding } from '@zextras/carbonio-design-system';

import { useFolderActions } from './use-folder-actions';
import { useFolder } from '../../carbonio-ui-commons/store/zustand/folder/hooks';
import { Folder } from '../../carbonio-ui-commons/types/folder';

type FolderActionWrapperProps = {
	folderId: Folder['id'];
	children?: React.JSX.Element;
};
export const FolderActionWrapper = ({
	folderId,
	children
}: FolderActionWrapperProps): React.JSX.Element => {
	const folder = useFolder(folderId);
	const dropdownItems = useFolderActions(folder as Folder);

	return (
		<Dropdown
			data-testid={`folder-context-menu-${folderId}`}
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
