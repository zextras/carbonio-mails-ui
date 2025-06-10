/*
 * SPDX-FileCopyrightText: 2021 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import React, { FC } from 'react';

import {
	AccordionItem,
	AccordionItemType,
	Avatar,
	Container,
	Icon,
	Padding,
	Row,
	Tooltip,
	useTheme
} from '@zextras/carbonio-design-system';
import { StaticBreadcrumbs } from '@zextras/carbonio-ui-commons';

import { isRoot } from 'helpers/folders';
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
const getFolderAbsPathParts = (
	folder: AccordionItemType & { absFolderPath?: string }
): Array<string> => {
	if (!folder) {
		return [];
	}

	// Exception for root folders
	if (isRoot(folder?.id)) {
		return [folder.label ?? ''];
	}
	const reg = /^\/?(.*)$/gm;

	const matches = reg.exec(folder.absFolderPath ?? '');
	if (!matches) {
		return [];
	}

	return matches[1].split('/');
};

const ModalAccordionCustomComponent: FC<{
	item: AccordionItemType;
}> = ({ item }) => {
	const theme = useTheme();
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

	return isRoot(item.id) ? (
		<Row
			data-testid={`folder-accordion-root-${item.id}`}
			height={'3rem'}
			style={{ maxWidth: `calc(100% - (2 * ${theme.sizes.padding.small}))` }}
		>
			<Padding horizontal="small">
				<Avatar label={item.label ?? ''} size="medium" />
			</Padding>
			<Tooltip label={item.label} placement="right" maxWidth="100%">
				<AccordionItem item={item} />
			</Tooltip>
		</Row>
	) : (
		<Container
			data-testid={`folder-accordion-item-${item.id}`}
			width="fill"
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
