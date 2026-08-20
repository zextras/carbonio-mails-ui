/*
 * SPDX-FileCopyrightText: 2021 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import React, { FC, useMemo } from 'react';

import { Button, Padding, Row, Tooltip } from '@zextras/carbonio-design-system';
import type { Folder } from '@zextras/carbonio-ui-commons';
import { Link } from 'react-router-dom';

import {
	getFolderIconColor,
	getFolderIconName,
	getSystemFolderTranslatedName
} from 'views/sidebar/utils';

const CollapsedSideBarItems: FC<{ folder: Folder }> = ({ folder }) => {
	const folderIconColor = useMemo(() => getFolderIconColor(folder), [folder]);
	const folderIconLabel = useMemo(() => getFolderIconName(folder), [folder]);
	const folderLabel = useMemo(
		() => getSystemFolderTranslatedName({ folderName: folder.name }),
		[folder.name]
	);

	return (
		<Link to={`folder/${folder.id}`} style={{ width: '100%', textDecoration: 'none' }}>
			<Row mainAlignment="flex-start" takeAvailableSpace>
				<Tooltip label={folderLabel} placement="right">
					<Padding all="extrasmall">
						<Button
							size="large"
							icon={folderIconLabel ?? ''}
							onClick={(): null => null}
							color={folderIconColor}
							type={'ghost'}
							aria-label={folderLabel}
						/>
					</Padding>
				</Tooltip>
			</Row>
		</Link>
	);
};

export default CollapsedSideBarItems;
