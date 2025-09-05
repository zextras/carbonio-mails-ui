/*
 * SPDX-FileCopyrightText: 2021 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import React, { FC, memo, useMemo } from 'react';

import { Accordion, Container, Divider, ThemeProvider } from '@zextras/carbonio-design-system';
import { SecondaryBarComponentProps } from '@zextras/carbonio-shell-ui';
import type { Folder } from '@zextras/carbonio-ui-commons';
import { FOLDERS, SidebarAccordionMui, themeMuiExtension } from '@zextras/carbonio-ui-commons';
import { map } from 'lodash';
import { Route, Routes, useParams } from 'react-router-dom';

import { LOCAL_STORAGES } from 'constants/index';
import { useFolders } from 'hooks/use-folders';
import { useGetTagsAccordion } from 'hooks/use-get-tags-accordions';
import type { SidebarComponentProps } from 'types/sidebar/index.d';
import AccordionCustomComponent from 'views/sidebar/accordion-custom-component';
import { ButtonFindShares } from 'views/sidebar/button-find-shares';
import CollapsedSideBarItems from 'views/sidebar/collapsed-sidebar-items';

const SidebarComponent: FC<SidebarComponentProps> = memo(function SidebarComponent({ accordions }) {
	const { folderId } = useParams() as { folderId: string };
	const tagsAccordionItems = useGetTagsAccordion();

	const accordionsWithFindShare = useMemo(() => {
		if (!accordions?.[0]?.children.find((folder: Folder) => folder.id === 'find_shares')) {
			accordions[0]?.children?.push({
				id: 'find_shares',
				// eslint-disable-next-line @typescript-eslint/ban-ts-comment
				// @ts-ignore
				disableHover: true
			});
		}
		return map(accordions, (item) => ({ ...item, background: 'gray4' }));
	}, [accordions]);
	return (
		<Container orientation="vertical" height="fit" width="fill">
			<SidebarAccordionMui
				accordions={accordionsWithFindShare}
				folderId={folderId}
				localStorageName={LOCAL_STORAGES.EXPANDED_FOLDERS}
				AccordionCustomComponent={AccordionCustomComponent}
				buttonFindShares={<ButtonFindShares key="button-find-shares" />}
				initialExpanded={[FOLDERS.USER_ROOT]}
			/>

			<Divider />
			<Accordion items={[tagsAccordionItems]} />
		</Container>
	);
});

const Sidebar: FC<SecondaryBarComponentProps> = ({ expanded }) => {
	const accordions = useFolders();

	return (
		<ThemeProvider extension={themeMuiExtension}>
			{expanded ? (
				<Routes>
					<Route
						path={`folder/:folderId/:type?/:itemId?`}
						element={<SidebarComponent accordions={accordions} />}
					/>
				</Routes>
			) : (
				accordions[0].children.map((folder) => (
					<CollapsedSideBarItems key={folder.id} folder={folder} />
				))
			)}
		</ThemeProvider>
	);
};

export default Sidebar;
