# Third-party notices

## marked

The WeChat formatting pipeline uses [marked](https://github.com/markedjs/marked), version 18.1.1, installed as a devDependency and bundled at build time, to parse Markdown into HTML before WeChat-specific inline styling is applied. It is MIT licensed; its complete notice follows. Current upstream license verified 2026-10-20.

MIT License

Copyright (c) 2018-2026, MarkedJS. (MIT License)
Copyright (c) 2011-2018, Christopher Jeffrey. (MIT License)

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.

## ssh2 and its bundled dependencies

The WeChat **fixed-IP relay (SSH tunnel)** uses [ssh2](https://github.com/mscdex/ssh2), version 1.17.0, a pure-JavaScript SSH2 client, bundled at build time. It opens a direct-tcpip channel on the user's own server so the WeChat `access_token` request leaves from the server's fixed IP. ssh2's optional native acceleration modules (`cpu-features`, `sshcrypto.node`) are **not** bundled; ssh2 falls back to its JavaScript implementation. ssh2 pulls in `asn1` 0.2.6 (MIT), `bcrypt-pbkdf` 1.0.2 (BSD-3-Clause / ISC-style, see below), `safer-buffer` 2.1.2 (MIT) and `tweetnacl` 0.14.5 (Unlicense, public domain). Licenses verified from the installed packages on 2026-10-20; complete notices follow.

### ssh2 (MIT)

Copyright Brian White. All rights reserved.

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to
deal in the Software without restriction, including without limitation the
rights to use, copy, modify, merge, publish, distribute, sublicense, and/or
sell copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in
all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING
FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS
IN THE SOFTWARE.

### asn1 (MIT)

Copyright (c) 2011 Mark Cavage, All rights reserved.

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in
all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
THE SOFTWARE

### safer-buffer (MIT)

MIT License

Copyright (c) 2018 Nikita Skovoroda <chalkerx@gmail.com>

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.

### bcrypt-pbkdf (BSD-3-Clause / ISC-style)

The Blowfish portions are under the following license:

Blowfish block cipher for OpenBSD
Copyright 1997 Niels Provos <provos@physnet.uni-hamburg.de>
All rights reserved.

Implementation advice by David Mazieres <dm@lcs.mit.edu>.

Redistribution and use in source and binary forms, with or without
modification, are permitted provided that the following conditions
are met:
1. Redistributions of source code must retain the above copyright
   notice, this list of conditions and the following disclaimer.
2. Redistributions in binary form must reproduce the above copyright
   notice, this list of conditions and the following disclaimer in the
   documentation and/or other materials provided with the distribution.
3. The name of the author may not be used to endorse or promote products
   derived from this software without specific prior written permission.

THIS SOFTWARE IS PROVIDED BY THE AUTHOR ``AS IS'' AND ANY EXPRESS OR
IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED WARRANTIES
OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE DISCLAIMED.
IN NO EVENT SHALL THE AUTHOR BE LIABLE FOR ANY DIRECT, INDIRECT,
INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES (INCLUDING, BUT
NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES; LOSS OF USE,
DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON ANY
THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT
(INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF
THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.



The bcrypt_pbkdf portions are under the following license:

Copyright (c) 2013 Ted Unangst <tedu@openbsd.org>

Permission to use, copy, modify, and distribute this software for any
purpose with or without fee is hereby granted, provided that the above
copyright notice and this permission notice appear in all copies.

THE SOFTWARE IS PROVIDED "AS IS" AND THE AUTHOR DISCLAIMS ALL WARRANTIES
WITH REGARD TO THIS SOFTWARE INCLUDING ALL IMPLIED WARRANTIES OF
MERCHANTABILITY AND FITNESS. IN NO EVENT SHALL THE AUTHOR BE LIABLE FOR
ANY SPECIAL, DIRECT, INDIRECT, OR CONSEQUENTIAL DAMAGES OR ANY DAMAGES
WHATSOEVER RESULTING FROM LOSS OF USE, DATA OR PROFITS, WHETHER IN AN
ACTION OF CONTRACT, NEGLIGENCE OR OTHER TORTIOUS ACTION, ARISING OUT OF
OR IN CONNECTION WITH THE USE OR PERFORMANCE OF THIS SOFTWARE.



Performance improvements (Javascript-specific):

Copyright 2016, Joyent Inc
Author: Alex Wilson <alex.wilson@joyent.com>

Permission to use, copy, modify, and distribute this software for any
purpose with or without fee is hereby granted, provided that the above
copyright notice and this permission notice appear in all copies.

THE SOFTWARE IS PROVIDED "AS IS" AND THE AUTHOR DISCLAIMS ALL WARRANTIES
WITH REGARD TO THIS SOFTWARE INCLUDING ALL IMPLIED WARRANTIES OF
MERCHANTABILITY AND FITNESS. IN NO EVENT SHALL THE AUTHOR BE LIABLE FOR
ANY SPECIAL, DIRECT, INDIRECT, OR CONSEQUENTIAL DAMAGES OR ANY DAMAGES
WHATSOEVER RESULTING FROM LOSS OF USE, DATA OR PROFITS, WHETHER IN AN
ACTION OF CONTRACT, NEGLIGENCE OR OTHER TORTIOUS ACTION, ARISING OUT OF
OR IN CONNECTION WITH THE USE OR PERFORMANCE OF THIS SOFTWARE.

### tweetnacl (Unlicense)

This is free and unencumbered software released into the public domain.

Anyone is free to copy, modify, publish, use, compile, sell, or
distribute this software, either in source code form or as a compiled
binary, for any purpose, commercial or non-commercial, and by any
means.

In jurisdictions that recognize copyright laws, the author or authors
of this software dedicate any and all copyright interest in the
software to the public domain. We make this dedication for the benefit
of the public at large and to the detriment of our heirs and
successors. We intend this dedication to be an overt act of
relinquishment in perpetuity of all present and future rights to this
software under copyright law.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND,
EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT.
IN NO EVENT SHALL THE AUTHORS BE LIABLE FOR ANY CLAIM, DAMAGES OR
OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE,
ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR
OTHER DEALINGS IN THE SOFTWARE.

For more information, please refer to <http://unlicense.org>

## twitter-text

The X (Twitter) publishing pipeline uses [twitter-text](https://github.com/twitter/twitter-text), version 3.1.0, bundled at build time, for the official weighted-length counting (CJK characters count 2, URLs count 23, NFC normalization) and URL-safe split boundaries. It is Apache-2.0 licensed; its copyright notice follows. Current license verified 2026-10-20.

Copyright 2011 Twitter, Inc.

Licensed under the Apache License, Version 2.0 (the "License");
you may not use this work except in compliance with the License.
You may obtain a copy of the License below, or at:

   http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing, software
distributed under the License is distributed on an "AS IS" BASIS,
WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
See the License for the specific language governing permissions and
limitations under the License.

                             Apache License
                       Version 2.0, January 2004
                    http://www.apache.org/licenses/

TERMS AND CONDITIONS FOR USE, REPRODUCTION, AND DISTRIBUTION

1. Definitions.

  "License" shall mean the terms and conditions for use, reproduction,
  and distribution as defined by Sections 1 through 9 of this document.

  "Licensor" shall mean the copyright owner or entity authorized by
  the copyright owner that is granting the License.

  "Legal Entity" shall mean the union of the acting entity and all
  other entities that control, are controlled by, or are under common
  control with that entity. For the purposes of this definition,
  "control" means (i) the power, direct or indirect, to cause the
  direction or management of such entity, whether by contract or
  otherwise, or (ii) ownership of fifty percent (50%) or more of the
  outstanding shares, or (iii) beneficial ownership of such entity.

  "You" (or "Your") shall mean an individual or Legal Entity
  exercising permissions granted by this License.

  "Source" form shall mean the preferred form for making modifications,
  including but not limited to software source code, documentation
  source, and configuration files.

  "Object" form shall mean any form resulting from mechanical
  transformation or translation of a Source form, including but
  not limited to compiled object code, generated documentation,
  and conversions to other media types.

  "Work" shall mean the work of authorship, whether in Source or
  Object form, made available under the License, as indicated by a
  copyright notice that is included in or attached to the work
  (an example is provided in the Appendix below).

  "Derivative Works" shall mean any work, whether in Source or Object
  form, that is based on (or derived from) the Work and for which the
  editorial revisions, annotations, elaborations, or other modifications
  represent, as a whole, an original work of authorship. For the purposes
  of this License, Derivative Works shall not include works that remain
  separable from, or merely link (or bind by name) to the interfaces of,
  the Work and Derivative Works thereof.

  "Contribution" shall mean any work of authorship, including
  the original version of the Work and any modifications or additions
  to that Work or Derivative Works thereof, that is intentionally
  submitted to Licensor for inclusion in the Work by the copyright owner
  or by an individual or Legal Entity authorized to submit on behalf of
  the copyright owner. For the purposes of this definition, "submitted"
  means any form of electronic, verbal, or written communication sent
  to the Licensor or its representatives, including but not limited to
  communication on electronic mailing lists, source code control systems,
  and issue tracking systems that are managed by, or on behalf of, the
  Licensor for the purpose of discussing and improving the Work, but
  excluding communication that is conspicuously marked or otherwise
  designated in writing by the copyright owner as "Not a Contribution."

  "Contributor" shall mean Licensor and any individual or Legal Entity
  on behalf of whom a Contribution has been received by Licensor and
  subsequently incorporated within the Work.

2. Grant of Copyright License. Subject to the terms and conditions of
  this License, each Contributor hereby grants to You a perpetual,
  worldwide, non-exclusive, no-charge, royalty-free, irrevocable
  copyright license to reproduce, prepare Derivative Works of,
  publicly display, publicly perform, sublicense, and distribute the
  Work and such Derivative Works in Source or Object form.

3. Grant of Patent License. Subject to the terms and conditions of
  this License, each Contributor hereby grants to You a perpetual,
  worldwide, non-exclusive, no-charge, royalty-free, irrevocable
  (except as stated in this section) patent license to make, have made,
  use, offer to sell, sell, import, and otherwise transfer the Work,
  where such license applies only to those patent claims licensable
  by such Contributor that are necessarily infringed by their
  Contribution(s) alone or by combination of their Contribution(s)
  with the Work to which such Contribution(s) was submitted. If You
  institute patent litigation against any entity (including a
  cross-claim or counterclaim in a lawsuit) alleging that the Work
  or a Contribution incorporated within the Work constitutes direct
  or contributory patent infringement, then any patent licenses
  granted to You under this License for that Work shall terminate
  as of the date such litigation is filed.

4. Redistribution. You may reproduce and distribute copies of the
  Work or Derivative Works thereof in any medium, with or without
  modifications, and in Source or Object form, provided that You
  meet the following conditions:

  (a) You must give any other recipients of the Work or
      Derivative Works a copy of this License; and

  (b) You must cause any modified files to carry prominent notices
      stating that You changed the files; and

  (c) You must retain, in the Source form of any Derivative Works
      that You distribute, all copyright, patent, trademark, and
      attribution notices from the Source form of the Work,
      excluding those notices that do not pertain to any part of
      the Derivative Works; and

  (d) If the Work includes a "NOTICE" text file as part of its
      distribution, then any Derivative Works that You distribute must
      include a readable copy of the attribution notices contained
      within such NOTICE file, excluding those notices that do not
      pertain to any part of the Derivative Works, in at least one
      of the following places: within a NOTICE text file distributed
      as part of the Derivative Works; within the Source form or
      documentation, if provided along with the Derivative Works; or,
      within a display generated by the Derivative Works, if and
      wherever such third-party notices normally appear. The contents
      of the NOTICE file are for informational purposes only and
      do not modify the License. You may add Your own attribution
      notices within Derivative Works that You distribute, alongside
      or as an addendum to the NOTICE text from the Work, provided
      that such additional attribution notices cannot be construed
      as modifying the License.

  You may add Your own copyright statement to Your modifications and
  may provide additional or different license terms and conditions
  for use, reproduction, or distribution of Your modifications, or
  for any such Derivative Works as a whole, provided Your use,
  reproduction, and distribution of the Work otherwise complies with
  the conditions stated in this License.

5. Submission of Contributions. Unless You explicitly state otherwise,
  any Contribution intentionally submitted for inclusion in the Work
  by You to the Licensor shall be under the terms and conditions of
  this License, without any additional terms or conditions.
  Notwithstanding the above, nothing herein shall supersede or modify
  the terms of any separate license agreement you may have executed
  with Licensor regarding such Contributions.

6. Trademarks. This License does not grant permission to use the trade
  names, trademarks, service marks, or product names of the Licensor,
  except as required for reasonable and customary use in describing the
  origin of the Work and reproducing the content of the NOTICE file.

7. Disclaimer of Warranty. Unless required by applicable law or
  agreed to in writing, Licensor provides the Work (and each
  Contributor provides its Contributions) on an "AS IS" BASIS,
  WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or
  implied, including, without limitation, any warranties or conditions
  of TITLE, NON-INFRINGEMENT, MERCHANTABILITY, or FITNESS FOR A
  PARTICULAR PURPOSE. You are solely responsible for determining the
  appropriateness of using or redistributing the Work and assume any
  risks associated with Your exercise of permissions under this License.

8. Limitation of Liability. In no event and under no legal theory,
  whether in tort (including negligence), contract, or otherwise,
  unless required by applicable law (such as deliberate and grossly
  negligent acts) or agreed to in writing, shall any Contributor be
  liable to You for damages, including any direct, indirect, special,
  incidental, or consequential damages of any character arising as a
  result of this License or out of the use or inability to use the
  Work (including but not limited to damages for loss of goodwill,
  work stoppage, computer failure or malfunction, or any and all
  other commercial damages or losses), even if such Contributor
  has been advised of the possibility of such damages.

9. Accepting Warranty or Additional Liability. While redistributing
  the Work or Derivative Works thereof, You may choose to offer,
  and charge a fee for, acceptance of support, warranty, indemnity,
  or other liability obligations and/or rights consistent with this
  License. However, in accepting such obligations, You may act only
  on Your own behalf and on Your sole responsibility, not on behalf
  of any other Contributor, and only if You agree to indemnify,
  defend, and hold each Contributor harmless for any liability
  incurred by, or claims asserted against, such Contributor by reason
  of your accepting any such warranty or additional liability.

## Qiaomu Design

Banana Design contains adaptations of the local Codex app-server bridge and provider preset data from [joeseesun/qiaomu-cover-design](https://github.com/joeseesun/qiaomu-cover-design), version 0.3.0. Its service-management and settings interaction informed this implementation. The reference checkout is read-only and is not the Banana Design source repository. The upstream material is MIT licensed; its complete notice follows. Current upstream license verified on 2026-10-19, main commit 62272849f382abae54cf13d0258e8c40f53ae1df. This is not an official Qiaomu product. Credit: 向阳乔木 (joeseesun), adapted upstream portions.

MIT License

Copyright (c) 2025-2026 向阳乔木 (joeseesun)

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.

## Preview assets and templates

`assets/neon-card.svg` is the original geometric layout preview supplied with Banana Design. `assets/dan-koe.png` is the AI-generated, untitled generic landscape preview supplied with Banana Design; it contains no article material and is not a work by Dan Koe. The template name describes a visual reference, not authorship or endorsement. Custom user templates, reference photos and generated article images are not bundled.

Both previews are embedded at build time. There are no bundled third-party fonts or runtime font downloads; the local Canvas renderer uses system fonts. Template prompts and `src/rendering/cover-layout.js` are authored for this plugin. Referenced external projects are design research references, not additional bundled dependencies.

## Host and tools

Obsidian supplies its API and Lucide icon rendering; Obsidian is not redistributed. Codex CLI is a user-installed external dependency and is not installed, updated or distributed by this plugin. esbuild is an MIT-licensed build-time dependency, pinned by package-lock.json; its runtime is not included in the plugin. No Fabric, React, Qiaomu templates, private account configuration, or external service SDK is bundled.

The Qiaomu notice above is also prepended verbatim to the distributed main.js so the standard three-file installer preserves it.

## Awesome GPT Image template research

The initial article-led recipes in `src/templates/catalog.js` use the category structures and production constraints documented by freestylefly in [awesome-gpt-image-2](https://github.com/freestylefly/awesome-gpt-image-2/blob/63e6176fa01be51c000108dacd72716d3e46784b/docs/templates.md), inspected 2026-10-19. The repository is MIT licensed; its notice follows. The recipes were rewritten for article evidence, independent output ratios and separate cover/body rules. Article-body previews are original geometric layout studies; seven cover directions use original AI-generated samples. The four newer editorial directions have independently written rules informed by publication-design references listed below. No upstream community image, publication cover, logo, real-person photograph or verbatim third-party case prompt is redistributed. The source repository separately disclaims ownership of third-party community cases; its MIT does not establish rights to those third-party works.

Editorial design references inspected during the 2026-10-20 template work include [The New Yorker / Time for Reflection](https://www.newyorker.com/culture/cover-story/cover-story-2022-07-25), Pentagram's [The Baffler](https://www.pentagram.com/work/the-baffler), [Tablet Magazine](https://www.pentagram.com/work/tablet-magazine) and [The Paris Review](https://www.pentagram.com/work/the-paris-review), [Kinfolk's magazine catalog](https://www.kinfolk.com/product-category/kinfolk-magazines/), and [Alex Hunting Studio](https://alexhunting.studio/pages/about). [AttentionVC's AI article list](https://www.attentionvc.ai/article?category=ai&lang=en%2Czh) supplied additional composition and typography research; displayed article views do not establish that a cover caused its popularity. These are visual-method references, not bundled artwork or endorsements. The current reusable rules and per-template source links are in `src/templates/catalog.js`; the original generated cover previews and comparison studies are in `assets/`.

MIT License

Copyright (c) 2026 freestylefly

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.


## Thirty-cover research expansion — 2026-10-20

The fourteen new directions in `src/templates/researched.js` and their SVG typography examples are independently authored. Public projects and template websites were inspected for visual methods, not imported as code or artwork. No repository case prompt is reproduced verbatim, and no community image, website template file, stock photo, font, publication identity or branded finished design is bundled. The article-specific planning, typography, text-free and dimension rules were rewritten for Banana Design. This is not an endorsed integration with any reference service.

The checked GitHub repository snapshots are recorded in `assets/template-research.json`:

| Research project | Stars checked | Repository license | Inspected method |
| --- | ---: | --- | --- |
| freestylefly/awesome-gpt-image-2 | 34,747 | MIT, full notice retained above | Poster hierarchy, action, ink double exposure, subject and whitespace |
| op7418/guizang-ppt-skill | 28,264 | AGPL-3.0 | Editorial hierarchy and cover proportions; no code, theme or asset incorporated |
| PicoTrex/Awesome-Nano-Banana-images | 23,914 | Apache-2.0 | Collage and coherent scene construction; no code, prompt text or community artwork incorporated |
| YouMind-OpenLab/awesome-nano-banana-pro-prompts | 13,637 | CC-BY-4.0 | Travel editorial, typography and ink-zine categories; no verbatim case prompt or image incorporated |
| ZeroLu/awesome-nanobanana-pro | 10,357 | MIT | Portrait, photo-book, diorama, magazine and scrapbook categories; no verbatim case prompt or image incorporated |
| ikuaitu/vue-fabric-editor | 7,999 | MIT | Editor/template workflow research; no runtime dependency or paid-template inventory incorporated |
| dromara/yft-design | 1,664 | MIT | Canvas editor research; no runtime dependency or template artwork incorporated |

The previously retained MIT notice covers the existing adapted freestylefly template research. Repository licenses do not establish rights to every linked third-party community work. YouMind OpenLab's collection is copyright (c) 2025 YouMind OpenLab under [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/); original case creators relevant to the research include lovimg_com (travel editorial), Gadgetify (typographic emergence) and Zayan (ink zine). PicoTrex credits tetumemo for its fashion collage case. ZeroLu credits NanoBanana for its magazine portrait and 歸藏 / op7418 for its narrative diorama. These credits identify the inspected public sources; Banana Design's new examples and rules change the topic, composition, typography, ratios and article-evidence behavior and contain none of those creators' images or literal prompt passages.

Website research covered [Canva blog graphics](https://www.canva.com/blog-graphics/templates/), [Kittl posters](https://www.kittl.com/templates/posters) and its Bauhaus, brutalist and art-show categories, [Fotor blog banners](https://www.fotor.com/blog-banner/templates/), [Adobe Express banners](https://www.adobe.com/express/templates/banner), and [Playground vintage posters](https://playgroundai.com/templates/s/vintage-poster). These sites' proprietary assets remain with their respective owners. Source links are references, not permission to redistribute their templates. Gaoding and Chuangkit public category descriptions were also screened; unavailable live galleries were not used as evidence for any unseen design. Specific inspection limits are recorded in the research JSON. Star counts are dated repository snapshots, not per-template ratings, usage or performance claims.
