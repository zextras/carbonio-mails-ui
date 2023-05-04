/*
 * SPDX-FileCopyrightText: 2021 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { ThemeProvider } from '@mui/material';
import { Accordion, Container, Divider } from '@zextras/carbonio-design-system';
import { FOLDERS } from '@zextras/carbonio-shell-ui';
import { map } from 'lodash';
import React, { FC, memo, useMemo } from 'react';
import { Route, Switch, useParams, useRouteMatch } from 'react-router-dom';
import { SidebarAccordionMui } from '../../carbonio-ui-commons/components/sidebar/sidebar-accordion-mui';
import { FOLDER_VIEW } from '../../carbonio-ui-commons/constants';
import { useFoldersByView } from '../../carbonio-ui-commons/store/zustand/folder/hooks';
import { themeMui } from '../../carbonio-ui-commons/theme/theme-mui';
import type { Folder } from '../../carbonio-ui-commons/types/folder';
import type { SidebarProps } from '../../carbonio-ui-commons/types/sidebar';
import useGetTagsAccordion from '../../hooks/use-get-tags-accordions';
import type { SidebarComponentProps } from '../../types/sidebar';
import AccordionCustomComponent from './accordion-custom-component';
import { ButtonFindShares } from './button-find-shares';
import CollapsedSideBarItems from './collapsed-sidebar-items';

const SidebarComponent: FC<SidebarComponentProps> = memo(function SidebarComponent({ accordions }) {
	const { folderId } = useParams<{ folderId: string }>();
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
				localStorageName="open_mails_folders"
				AccordionCustomComponent={AccordionCustomComponent}
				buttonFindShares={<ButtonFindShares key="button-find-shares" />}
				initialExpanded={[FOLDERS.USER_ROOT]}
			/>

			<Divider />
			<Accordion items={[tagsAccordionItems]} />
		</Container>
	);
});

const Sidebar: FC<SidebarProps> = ({ expanded }) => {
	const { path } = useRouteMatch();
	const accordions = useFoldersByView(FOLDER_VIEW.message);
	return (
		<>
			<ThemeProvider theme={themeMui}>
				{expanded ? (
					<Switch>
						<Route path={`${path}/folder/:folderId/:type?/:itemId?`}>
							<SidebarComponent accordions={accordions} />
						</Route>
					</Switch>
				) : (
					accordions[0].children.map((folder) => (
						<CollapsedSideBarItems key={folder.id} folder={folder} />
					))
				)}
			</ThemeProvider>
		</>
	);
};

export default Sidebar;
