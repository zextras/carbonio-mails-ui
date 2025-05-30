/*
 * SPDX-FileCopyrightText: 2025 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import React, { useCallback } from 'react';

import { Container, Icon, Row } from '@zextras/carbonio-design-system';
import { Folder, isRoot, StaticBreadcrumbs } from '@zextras/carbonio-ui-commons';
import { noop } from 'lodash';

import {
	getFolderIconColor,
	getFolderIconName,
	getSystemFolderTranslatedName
} from 'views/sidebar/utils';

/**
 * Process the absolute path of the given folder, removing
 * the leading slash
 *
 * @param folder
 * @return the array of the crumbs name of the path
 */
const getFolderAbsPathParts = (folder: Folder): Array<string> => {
	if (!folder) {
		return [];
	}

	// Exception for root folders
	if (isRoot(folder?.id)) {
		return [folder.name ?? ''];
	}
	const reg = /^\/?(.*)$/gm;

	const matches = reg.exec(folder.absFolderPath ?? '');
	if (!matches) {
		return [];
	}

	return matches[1].split('/');
};

export type FlaFolderProps = {
	folder: Folder;
	selected?: boolean;
	onFolderSelected?: (arg: Folder) => void;
};

export const FlatFolder = ({
	folder,
	onFolderSelected,
	...rest
}: FlaFolderProps): React.JSX.Element => {
	const iconName = getFolderIconName(folder);
	const iconColor = getFolderIconColor(folder);
	const parts = getFolderAbsPathParts(folder);

	/*
	 * Create the crumbs array and try to get the translations
	 * for the first part which usually represent a system folder
	 * for which a translated name is available
	 */
	const crumbs = parts.map((part, index) => ({
		id: `${index} `,
		label: index === 0 ? getSystemFolderTranslatedName({ folderName: part }) : part
	}));

	const selectionHandler = useCallback(
		() => onFolderSelected?.(folder) ?? noop,
		[onFolderSelected, folder]
	);

	return (
		<Container
			width="fill"
			main-alignment="flex-start"
			orientation="vertical"
			crossAlignment="flex-start"
			padding={{ top: 'small', right: 'small', bottom: 'small', left: 'extralarge' }}
			height={'2.6rem'}
			onClick={selectionHandler}
			wrap="nowrap"
			{...rest}
		>
			<Row mainAlignment="flex-start" wrap="nowrap" width="fill">
				<Container width="fit">
					<Icon color={iconColor} icon={iconName ?? 'FolderOutline'} size="large" />
				</Container>
				<StaticBreadcrumbs crumbs={crumbs} size="large" />
			</Row>
		</Container>
	);
};
