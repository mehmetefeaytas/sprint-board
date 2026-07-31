# Sprint Board MCP sunucusu

Panoyu **Claude Code, Codex, OpenCode** ve MCP konuşan diğer araçların içinden
kullanmanı sağlar. Tarayıcıya geçmeden "bugün bana ne kaldı", "şu görevi
tamamlandı işaretle", "@Deniz'e sor" diyebilirsin.

Ajanın yaptığı her değişiklik, tıpkı panodan yapılmış gibi **aktivite kaydına
senin adına** düşer. Denetim izi bozulmaz.

## Kurulum

```bash
cd mcp
npm install
```

Sunucu iki ortam değişkeni ister:

| Değişken | Ne için |
|---|---|
| `DATABASE_URL` | Panonun veritabanı adresi. Vercel'deki değeri `vercel env pull` ile alabilirsin. |
| `SPRINT_BOARD_ACTOR` | Senin e-postan. Yazma işlemleri bu kişi adına kaydedilir; panoda kayıtlı olmak zorunda. |

Doğru çalıştığını şöyle sınarsın — sunucu `sprint-board MCP hazır` yazıp
beklemeye geçmeli (Ctrl+C ile çık):

```bash
DATABASE_URL='postgres://...' SPRINT_BOARD_ACTOR='sen@ornek.com' node mcp/server.js
```

## Araca bağlama

Aşağıdaki örneklerde `/mutlak/yol/sprint-board` yerine deponun kendi yolunu yaz.
Mutlak yol kullan: araçlar sunucuyu farklı çalışma dizinlerinden başlatabilir.

### Claude Code

```bash
claude mcp add --env DATABASE_URL='postgres://...' \
  --env SPRINT_BOARD_ACTOR='sen@ornek.com' \
  --transport stdio sprint-board \
  -- node /mutlak/yol/sprint-board/mcp/server.js
```

`--` işareti zorunlu: öncesi Claude'un kendi seçenekleri, sonrası sunucuyu
çalıştıran komut. Ayrıca sunucu adını doğrudan `--env`'den sonra yazma, CLI onu
başka bir `KEY=value` çifti sanır.

Ekiple paylaşmak istersen depo kökündeki `.mcp.json.example` dosyasını
`.mcp.json` olarak kopyala ve yolları düzelt. Sırların depoya girmemesi için
değerleri `${DATABASE_URL}` gibi kabuk değişkeni olarak bırakabilirsin.

### Codex

`~/.codex/config.toml`:

```toml
[mcp_servers.sprint-board]
command = "node"
args = ["/mutlak/yol/sprint-board/mcp/server.js"]

[mcp_servers.sprint-board.env]
DATABASE_URL = "postgres://..."
SPRINT_BOARD_ACTOR = "sen@ornek.com"
```

Ya da CLI ile:

```bash
codex mcp add sprint-board --env DATABASE_URL='postgres://...' \
  --env SPRINT_BOARD_ACTOR='sen@ornek.com' \
  -- node /mutlak/yol/sprint-board/mcp/server.js
```

### OpenCode

`opencode.json` (proje) veya `~/.config/opencode/opencode.json` (genel):

```json
{
  "$schema": "https://opencode.ai/config.json",
  "mcp": {
    "sprint-board": {
      "type": "local",
      "command": ["node", "/mutlak/yol/sprint-board/mcp/server.js"],
      "enabled": true,
      "environment": {
        "DATABASE_URL": "postgres://...",
        "SPRINT_BOARD_ACTOR": "sen@ornek.com"
      }
    }
  }
}
```

### Diğer araçlar

Sunucu standart stdio MCP'si konuşur. Çalıştırma komutu her yerde aynı:
`node <yol>/mcp/server.js`, yanında iki ortam değişkeni. Yapılandırma
dosyasının biçimi araca göre değişir; bu üç örneği şablon olarak kullan.

## Araçlar

### Okuma

| Araç | Ne yapar |
|---|---|
| `list_tasks` | Görevleri filtreleyerek listeler: `day_no`, `track`, `status`, `assignee`, `label`, `unassigned`, `blockers_only` |
| `get_task` | Bir görevin tüm alanları, etiketleri ve yorumları (`code` büyük/küçük harf duyarsız) |
| `sprint_summary` | Gün gün ilerleme, kişi başı tamamlama, açık blokerler |
| `list_activity` | Kim ne yaptı; `actor` veya `task_code` ile filtrelenir |
| `list_people` | Kayıtlı kişiler, track'leri, yönetici durumu |

### Yazma

| Araç | Ne yapar |
|---|---|
| `set_task_status` | Durumu değiştirir. `done` seçilirse tamamlayan ve zaman da yazılır |
| `assign_task` | Görev atar. `email` verilmezse görevi sen üstlenirsin; devralınabilir bir işte bu `claim`, diğerlerinde `assign` olarak kaydedilir. `unassign: true` sahipsiz bırakır |
| `create_task` | Yeni görev açar; kod verilmezse `G{gün}-{TRACK}-{sıra}` olarak üretilir |
| `add_comment` | Yorum bırakır; gövdedeki `@Ad` etiketleri mention olarak çözülür |
| `set_task_labels` | Etiket ekler / çıkarır |

**Silme aracı bilinçli olarak yok.** Bir ajanın yanlış anlamayla görev
silmesini istemiyoruz; silme panodan, insan eliyle yapılır.

## Nasıl çalışır

Sunucu web uygulamasının HTTP API'sine değil **doğrudan veritabanına** bağlanır
(`pg` sürücüsü). Böylece yeni bir kimlik doğrulama yüzeyi — servis hesabı, API
anahtarı — açmak gerekmez; MCP'yi kuran kişi zaten `DATABASE_URL`'e sahiptir.

Bunun iki sonucu var:

- **Yetki kontrolü panoyla aynı değil.** Web tarafında silme yönetici işidir;
  burada silme hiç yok. Onun dışında MCP, `SPRINT_BOARD_ACTOR` olarak
  tanımladığın kişinin yapabileceği her şeyi yapar.
- **`DATABASE_URL` tam yetkidir.** Onu paylaşmak panonun tamamını paylaşmaktır.

Yazma işlemleri `activity_log` tablosuna, web tarafındaki `lib/audit.ts` ile
aynı biçimde yazılır. Panodaki Aktivite ekranında MCP'den gelen hareketleri de
görürsün — ayrı bir yere gitmez.
