/*
 * SPDX-FileCopyrightText: 2021 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import React, { FC, useMemo } from 'react';
import { AccordionFolder, AppLink } from '@zextras/carbonio-shell-ui';
import { Row, Padding, Tooltip, IconButton } from '@zextras/carbonio-design-system';
import { getFolderIconColor, getFolderIconName } from './utils';

const CollapsedSideBarItems: FC<{ folder: AccordionFolder }> = ({ folder }) => {
	const folderIconColor = useMemo(() => getFolderIconColor(folder), [folder]);
	const folderIconLabel = useMemo(() => getFolderIconName(folder), [folder]);

	return (
		<AppLink to={`/folder/${folder.id}`} style={{ width: '100%', textDecoration: 'none' }}>
			<Row mainAlignment="flex-start" takeAvailableSpace>
				<Tooltip label={folder.label} placement="right">
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
