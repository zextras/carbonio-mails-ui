/*
 * SPDX-FileCopyrightText: 2021 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import {
	Breadcrumbs,
	Container,
	Crumb,
	Icon,
	Padding,
	Row,
	Text,
	Tooltip
} from '@zextras/carbonio-design-system';
import { join } from 'lodash';
import React, { FC } from 'react';
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
	 * Remove the first part of the path and try to translate it, because:
	 * - the Breadcrumbs component (currently) when need to collapse some crumbs
	 *   start from the first element from the left. We need to keep it visible
	 * - the first element usually is a system folder, and for those folders we
	 *   have the translation
	 */
	const firstPart = getSystemFolderTranslatedName({ folderName: parts.shift() ?? '' });
	const translatedTooltipText = join([firstPart, ...parts], '/');
	const crumbs = parts.map<Crumb>((part, index) => ({
		id: `${index}`,
		label: part
	}));

	return (
		<Container
			data-testid={`folder-accordion-item-${item.id}`}
			width="fill"
			main-alignment="flex-start"
			orientation="vertical"
			crossAlignment="flex-start"
			padding="medium"
			wrap="nowrap"
		>
			<Tooltip label={translatedTooltipText}>
				<Row mainAlignment="flex-start" wrap="nowrap" width="fill">
					<Container width="fit">
						<Icon color={iconColor} icon={iconName || 'FolderOutline'} size="large" />
					</Container>
					<Container
						width="fit"
						mainAlignment="flex-start"
						padding={{ left: 'small', right: 'extrasmall' }}
					>
						<Text size="large">{firstPart}</Text>
					</Container>
					<Container mainAlignment="flex-start">
						<Breadcrumbs crumbs={crumbs}></Breadcrumbs>
					</Container>
				</Row>
			</Tooltip>
		</Container>
	);
};
export default ModalAccordionCustomComponent;
