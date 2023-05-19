/*
 * SPDX-FileCopyrightText: 2021 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import { Container, Icon, Row } from '@zextras/carbonio-design-system';
import React, { FC } from 'react';
import { StaticBreadcrumbs } from '../../../../carbonio-ui-commons/components/breadcrumbs/static-breadcrumbs';
import { Folder } from '../../../../carbonio-ui-commons/types/folder';
import { isRoot } from '../../../../helpers/folders';
import { getFolderIconColor, getFolderIconName, getSystemFolderTranslatedName } from '../../utils';

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
		return [folder.name];
	}
	const reg = /^\/?(.*)$/gm;

	const matches = reg.exec(folder.absFolderPath ?? '');
	if (!matches) {
		return [];
	}

	return matches[1].split('/');
};

const ModalAccordionCustomComponent: FC<{
	item: Folder;
}> = ({ item }) => {
	const iconName = getFolderIconName(item);
	const iconColor = getFolderIconColor(item);
	const parts = getFolderAbsPathParts(item);

	/*
	 * Create the crumbs array and try to get the translations
	 * for the first part which usually represent a system folder
	 * for which a translated name is available
	 */
	const crumbs = parts.map((part, index) => ({
		id: `${index}`,
		label: index === 0 ? getSystemFolderTranslatedName({ folderName: part }) : part
	}));

	return (
		<Container
			data-testid={`folder-accordion-item-${item.id}`}
			width="fill"
			main-alignment="flex-start"
			orientation="vertical"
			crossAlignment="flex-start"
			padding="small"
			wrap="nowrap"
		>
			<Row mainAlignment="flex-start" wrap="nowrap" width="fill">
				<Container width="fit">
					<Icon color={iconColor} icon={iconName || 'FolderOutline'} size="large" />
				</Container>
				<StaticBreadcrumbs crumbs={crumbs} size="large" />
			</Row>
		</Container>
	);
};
export default ModalAccordionCustomComponent;
