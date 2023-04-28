/*
 * SPDX-FileCopyrightText: 2021 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import { IconButton, Padding, Row, Tooltip } from '@zextras/carbonio-design-system';
import { AppLink } from '@zextras/carbonio-shell-ui';
import React, { FC, useMemo } from 'react';
import type { Folder } from '../../carbonio-ui-commons/types/folder';
import { getFolderIconColor, getFolderIconName, getSystemFolderTranslatedName } from './utils';

const CollapsedSideBarItems: FC<{ folder: Folder }> = ({ folder }) => {
	const folderIconColor = useMemo(() => getFolderIconColor(folder), [folder]);
	const folderIconLabel = useMemo(() => getFolderIconName(folder), [folder]);

	return (
		<AppLink to={`/folder/${folder.id}`} style={{ width: '100%', textDecoration: 'none' }}>
			<Row mainAlignment="flex-start" takeAvailableSpace>
				<Tooltip
					label={getSystemFolderTranslatedName({ folderName: folder.name })}
					placement="right"
				>
					<Padding all="extrasmall">
						<IconButton
							customSize={{ iconSize: 'large', paddingSize: 'small' }}
							icon={folderIconLabel ?? ''}
							customIconColor={folderIconColor}
							onClick={(): null => null}
						/>
					</Padding>
				</Tooltip>
			</Row>
		</AppLink>
	);
};

export default CollapsedSideBarItems;
