/*
 * SPDX-FileCopyrightText: 2021 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import React, { FC, useMemo } from 'react';

import { Button, Padding, Row, Tooltip } from '@zextras/carbonio-design-system';
import type { Folder } from '@zextras/carbonio-ui-commons';
import { Link, matchPath, useLocation } from 'react-router-dom';

import { MAILS_ROUTE } from 'constants/index';
import {
	getFolderIconColor,
	getFolderIconName,
	getSystemFolderTranslatedName
} from 'views/sidebar/utils';

export interface CollapsedSideBarItemsProps {
	folder: Folder;
	isSelected?: boolean;
}

const CollapsedSideBarItems: FC<CollapsedSideBarItemsProps> = ({ folder, isSelected }) => {
	const { pathname } = useLocation();
	const active = useMemo(() => {
		if (isSelected !== undefined) {
			return isSelected;
		}
		const match =
			matchPath(`/${MAILS_ROUTE}/folder/:folderId/*`, pathname) ??
			matchPath(`/folder/:folderId/*`, pathname);
		return match?.params?.folderId === folder.id;
	}, [isSelected, pathname, folder.id]);

	const folderIconColor = useMemo(() => getFolderIconColor(folder), [folder]);
	const folderIconLabel = useMemo(() => getFolderIconName(folder), [folder]);
	const folderLabel = useMemo(
		() => getSystemFolderTranslatedName({ folderName: folder.name }),
		[folder.name]
	);

	return (
		<Link to={`folder/${folder.id}`} style={{ width: '100%', textDecoration: 'none' }}>
			<Row mainAlignment="center" crossAlignment="center" takeAvailableSpace>
				<Tooltip label={folderLabel} placement="right">
					<Padding all="extrasmall">
						<Button
							size="large"
							icon={folderIconLabel ?? ''}
							onClick={(): null => null}
							backgroundColor={active ? 'highlight' : 'transparent'}
							labelColor={folderIconColor || 'text'}
							aria-label={folderLabel}
						/>
					</Padding>
				</Tooltip>
			</Row>
		</Link>
	);
};

export default CollapsedSideBarItems;
