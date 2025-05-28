/*
 * SPDX-FileCopyrightText: 2024 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import { GenericSoapApiError } from '@zextras/carbonio-ui-commons';
import { TFunction } from 'i18next';

export class CreateMountpointError extends GenericSoapApiError {
	public static readonly FOLDER_ALREADY_EXISTS = 'mail.ALREADY_EXISTS';

	override getLocalizedMessage(t: TFunction): string {
		if (this.fault.Detail.Error.Code === CreateMountpointError.FOLDER_ALREADY_EXISTS) {
			return t(
				'api.error.CreateMountpoint.folder_already_exists',
				'A folder/calendar/addressbook with the same name already exists'
			);
		}

		return super.getLocalizedMessage(t);
	}
}
