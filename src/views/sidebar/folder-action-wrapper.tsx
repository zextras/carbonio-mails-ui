/*
 * SPDX-FileCopyrightText: 2025 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import React from 'react';

import { Dropdown, Padding, Row } from '@zextras/carbonio-design-system';
import { Folder } from '@zextras/carbonio-ui-commons';

import { useFolderActions } from 'views/sidebar/use-folder-actions';

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
			<Row data-testid="folder-context-menu-child">
				<Padding left="small" />
				{children}
			</Row>
		</Dropdown>
	);
};
