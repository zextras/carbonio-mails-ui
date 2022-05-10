/*
 * SPDX-FileCopyrightText: 2021 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import React, { useRef, FC, useContext } from 'react';
import { Folder, useFoldersAccordionByView } from '@zextras/carbonio-shell-ui';
import { Accordion, Container, Button, ModalManagerContext } from '@zextras/carbonio-design-system';
import { useDispatch } from 'react-redux';
import { filter, isEqual, uniqWith } from 'lodash';
import { useTranslation } from 'react-i18next';
import CollapsedSideBarItems from './collapsed-sidebar-items';
import { FOLDER_VIEW } from '../../constants';
import { AccordionCustomComponent } from './accordion-custom-component';
import { getShareInfo } from '../../store/actions/get-share-info';
import { SharesModal } from './shares-modal';
import { ResFolder } from '../../types/commons';

type SidebarProps = {
	expanded: boolean;
};

const Sidebar: FC<SidebarProps> = ({ expanded }) => {
	const sidebarRef = useRef(null);
	const [t] = useTranslation();
	const dispatch = useDispatch();
	// eslint-disable-next-line @typescript-eslint/ban-types
	const createModal = useContext(ModalManagerContext) as Function;
	// eslint-disable-next-line @typescript-eslint/ban-ts-comment
	// @ts-ignore
	const accordions = useFoldersAccordionByView(FOLDER_VIEW.message, AccordionCustomComponent);

	return (
		<>
			{expanded ? (
				<>
					<Container orientation="vertical" height="fit">
						<Accordion ref={sidebarRef} items={accordions} />
						<Container style={{ padding: '8px 16px' }}>
							<Button
								type="outlined"
								label={t('label.find_shares', 'Find shares')}
								color="primary"
								size="fill"
								onClick={(ev: MouseEvent): void => {
									ev.stopPropagation();
									dispatch(getShareInfo())
										// eslint-disable-next-line @typescript-eslint/ban-ts-comment
										// @ts-ignore
										.then((res: any) => {
											if (res.type.includes('fulfilled') && res.payload?.share?.length > 0) {
												const resFolders: Array<ResFolder> = uniqWith(
													filter(res.payload.share, ['view', 'message']),
													isEqual
												);
												const closeModal = createModal(
													{
														children: (
															<SharesModal
																folders={resFolders}
																onClose={(): void => closeModal()}
															/>
														)
													},
													true
												);
											}
										});
								}}
							/>
						</Container>
					</Container>
				</>
			) : (
				accordions[0].items.map((folder: Folder, index: number) => (
					<CollapsedSideBarItems key={index} folder={folder} />
				))
			)}
		</>
	);
};

export default Sidebar;
