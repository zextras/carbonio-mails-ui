/*
 * SPDX-FileCopyrightText: 2024 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import { faker } from '@faker-js/faker';

type CreateFakeFileParams = {
	content?: string;
	name?: string;
	mimeType?: string;
};

export const createFakeFile = ({
	content = faker.string.alphanumeric(faker.number.int({ min: 1, max: 256 })),
	name = faker.system.fileName(),
	mimeType = faker.system.mimeType()
}: CreateFakeFileParams = {}): File => new File([content], name, { type: mimeType });
