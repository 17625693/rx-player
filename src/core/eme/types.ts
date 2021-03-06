/**
 * Copyright 2015 CANAL+ Group
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import {
  IMediaKeySession,
  IMediaKeySystemAccess,
  IMockMediaKeys,
} from "../../compat";
import SessionsStore from "./utils/open_sessions_store";
import PersistedSessionsStore from "./utils/persisted_session_store";

// Infos indentifying a MediaKeySystemAccess
export interface IKeySystemAccessInfos {
  keySystemAccess: IMediaKeySystemAccess;
  keySystemOptions: IKeySystemOption;
}

// Infos identyfing a single MediaKey
export interface IMediaKeysInfos {
  mediaKeySystemAccess: IMediaKeySystemAccess;
  keySystemOptions: IKeySystemOption; // options set by the user
  mediaKeys : MediaKeys|IMockMediaKeys;
  sessionsStore : SessionsStore;
  sessionStorage : PersistedSessionsStore|null;
}

// Data stored in a persistent MediaKeySession storage
export interface IPersistedSessionData {
  sessionId : string;
  initData : number;
  initDataType : string|undefined;
}

// MediaKeySession storage interface
export interface IPersistedSessionStorage {
  load() : IPersistedSessionData[];
  save(x : IPersistedSessionData[]) : void;
}

// Options given by the caller
export interface IKeySystemOption {
  type : string;
  getLicense : (message : Uint8Array, messageType : string)
    => Promise<TypedArray|ArrayBuffer>|TypedArray|ArrayBuffer;
  serverCertificate? : ArrayBuffer|TypedArray;
  persistentLicense? : boolean;
  licenseStorage? : IPersistedSessionStorage;
  persistentStateRequired? : boolean;
  distinctiveIdentifierRequired? : boolean;
  closeSessionsOnStop? : boolean;
  onKeyStatusesChange? : (evt : Event, session : IMediaKeySession|MediaKeySession)
    => Promise<TypedArray|ArrayBuffer>|TypedArray|ArrayBuffer;
  videoRobustnesses?: Array<string|undefined>;
  audioRobustnesses?: Array<string|undefined>;
}

// Keys are the different key statuses possible.
// Values are ``true`` if such key status defines an error
/* tslint:disable no-object-literal-type-assertion */
export const KEY_STATUS_ERRORS = {
  expired: true,
  "internal-error": true,
   // "released",
   // "output-restricted",
   // "output-downscaled",
   // "status-pending",
} as IDictionary<boolean>;
/* tslint:enable no-object-literal-type-assertion */
