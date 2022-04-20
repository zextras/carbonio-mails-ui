/*
 * SPDX-FileCopyrightText: 2021 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { actionsRetriever } from '../../views/sidebar/commons/folder-actions';

// export const setDropdownActions = ({
// 	folder,
// 	setAction,
// 	setCurrentFolder,
// 	t,
// 	dispatch,
// 	createModal
// }: SetDropdownActionsProps): AccordionCustomComponent => {
// 	const actions = actionsRetriever({
// 		folder,
// 		setAction,
// 		setCurrentFolder,
// 		t,
// 		dispatch,
// 		createModal
// 	});

// 	switch (folder?.id) {
// 		// default folders
// 		case FOLDERS.INBOX:
// 		case FOLDERS.SENT:
// 		case FOLDERS.DRAFTS:
// 			return actions
// 				.filter(
// 					(action: Record<string, unknown>) =>
// 						action.id !== FolderActionsType.SHARES_INFO &&
// 						action.id !== FolderActionsType.REMOVE_FROM_LIST
// 				)
// 				.map((action: Record<string, unknown>) =>
// 					action.id === FolderActionsType.MOVE || action.id === FolderActionsType.DELETE
// 						? { ...action, disabled: true }
// 						: action
// 				);

// 		case FOLDERS.SPAM:
// 			return actions
// 				.filter(
// 					(action: Record<string, unknown>) =>
// 						action.id !== FolderActionsType.SHARES_INFO &&
// 						action.id !== FolderActionsType.REMOVE_FROM_LIST
// 				)
// 				.map((action: Record<string, unknown>) =>
// 					action.id === FolderActionsType.NEW ||
// 					action.id === FolderActionsType.MOVE ||
// 					action.id === FolderActionsType.DELETE
// 						? { ...action, disabled: true }
// 						: action
// 				);
// 		case FOLDERS.TRASH:
// 			return actions
// 				.filter(
// 					(action: Record<string, unknown>) =>
// 						action.id !== FolderActionsType.SHARES_INFO &&
// 						action.id !== FolderActionsType.REMOVE_FROM_LIST
// 				)
// 				.map((action: Record<string, unknown>) => action);
// 		// customizable folders
// 		default:
// 			return folder?.owner
// 				? actions.filter(
// 						(action: Record<string, unknown>) =>
// 							action.id === FolderActionsType.SHARES_INFO ||
// 							action.id === FolderActionsType.REMOVE_FROM_LIST ||
// 							action.id === FolderActionsType.EDIT
// 				  )
// 				: actions
// 						.filter(
// 							(action: Record<string, unknown>) =>
// 								action.id !== FolderActionsType.SHARES_INFO &&
// 								action.id !== FolderActionsType.REMOVE_FROM_LIST
// 						)
// 						.map((action: Record<string, unknown>) => {
// 							if (
// 								(folder.level > 2 && action.id === FolderActionsType.NEW) ||
// 								(folder.depth > 2 &&
// 									folder.parent === FOLDERS.USER_ROOT &&
// 									action.id === FolderActionsType.MOVE) ||
// 								(folder.absParent === FOLDERS.TRASH &&
// 									(action.id === FolderActionsType.NEW || action.id === FolderActionsType.EDIT)) ||
// 								(folder.parent === FOLDERS.TRASH &&
// 									(action.id === FolderActionsType.NEW || action.id === FolderActionsType.EDIT)) ||
// 								(folder.absParent === FOLDERS.TRASH && action.id === FolderActionsType.EMPTY)
// 							) {
// 								return { ...action, disabled: true };
// 							}
// 							return action;
// 						});
// 	}
// };
